import { IUniversalWorker, IUniversalWorkerFactory, WorkerEvent } from "./universal-worker/IWorker";
import {
	SegmentSolver,
	SegmentSolverInput,
	SegmentSolverOutput,
	SegmentWorkerMessage,
	SegmentWorkerResponse,
} from "./workers/SegmentWorker";

type Task = {
	message: SegmentWorkerMessage;
	resolve: (value: ReturnType<SegmentSolver>) => void;
	reject: (reason: any) => void;
};

type PoolWorker = {
	worker: IUniversalWorker;
	busy: boolean;
	currentTaskId?: string;
};

let UniversalWorkerFactory: typeof import("./universal-worker/Worker.browser").UniversalWorkerFactory; // Placeholder for type inference

// Load the correct worker implementation based on the platform
if (process.env.RUNTIME === "node") {
	UniversalWorkerFactory = require("./universal-worker/Worker.node.ts").UniversalWorkerFactory;
} else {
	UniversalWorkerFactory = require("./universal-worker/Worker.browser.ts").UniversalWorkerFactory;
}

export class SegmentWorkerPool {
	private workers: PoolWorker[] = [];
	private taskQueue: Task[] = [];
	private activeTasks: Map<string, Task> = new Map();
	private readonly maxWorkers: number;
	private workerFactory: IUniversalWorkerFactory;

	constructor(maxWorkers?: number) {
		this.workerFactory = new UniversalWorkerFactory();
		const availableCpus = this.workerFactory.getAvailableParallelism();
		this.maxWorkers = maxWorkers || availableCpus;
	}

	private createWorker(): PoolWorker {
		const worker = this.workerFactory.createWorker();

		const poolWorker: PoolWorker = {
			worker,
			busy: false,
		};

		worker.addEventListener("message", (event: WorkerEvent<SegmentWorkerResponse>) => {
			const { taskId, payload } = event.data;

			// Find task in activeTasks map instead of queue
			const task = this.activeTasks.get(taskId);
			if (task) {
				// Remove from active tasks and resolve
				this.activeTasks.delete(taskId);
				task.resolve(payload);
			}

			// Reset worker state
			poolWorker.busy = false;
			poolWorker.currentTaskId = undefined;

			// Process next task
			this.processNextTask();
		});

		worker.addEventListener("error", error => {
			const taskId = poolWorker.currentTaskId;
			if (taskId) {
				const task = this.activeTasks.get(taskId);
				if (task) {
					this.activeTasks.delete(taskId);
					task.reject(error);
				}
			}
			poolWorker.busy = false;
			poolWorker.currentTaskId = undefined;
			this.processNextTask();
		});

		return poolWorker;
	}

	private getAvailableWorker(): PoolWorker | null {
		// Find existing free worker
		const freeWorker = this.workers.find(w => !w.busy);
		if (freeWorker) return freeWorker;

		// Create new worker if below max
		if (this.workers.length < this.maxWorkers) {
			const newWorker = this.createWorker();
			this.workers.push(newWorker);
			return newWorker;
		}

		return null;
	}

	private processNextTask(): void {
		//this.logWorkersState();
		// Process all available tasks that can be assigned to workers
		while (this.taskQueue.length > 0) {
			const worker = this.getAvailableWorker();

			if (!worker) {
				// No available workers, exit the processing loop
				break;
			}

			// Remove the task from queue BEFORE processing it
			const task = this.taskQueue.shift(); // Use shift() instead of accessing index 0
			if (!task) break;

			// Store task in activeTasks map before processing
			this.activeTasks.set(task.message.taskId, task);

			// Mark worker as busy and assign task
			worker.busy = true;
			worker.currentTaskId = task.message.taskId;
			worker.worker.postMessage(task.message);
		}
	}

	public submitTask(payload: SegmentSolverInput): Promise<SegmentSolverOutput> {
		return new Promise((resolve, reject) => {
			const taskId = Math.random().toString(36).substr(2, 9);
			const message: SegmentWorkerMessage = {
				type: "SOLVE",
				payload,
				taskId,
			};

			const task: Task = { message, resolve, reject };
			this.taskQueue.push(task);
			this.processNextTask();
		});
	}

	public terminate(): void {
		// Reject all pending tasks
		this.taskQueue.forEach(task => {
			task.reject(new Error("Worker pool terminated"));
		});
		this.taskQueue = [];

		// Reject all active tasks
		this.activeTasks.forEach(task => {
			task.reject(new Error("Worker pool terminated"));
		});
		this.activeTasks.clear();

		// Terminate all workers
		this.workers.forEach(worker => {
			worker.worker.terminate();
		});
		this.workers = [];
	}

	// Monitoring method for debugging
	private logWorkersState(): void {
		console.log(
			"Workers state:",
			this.workers.map(worker => ({
				busy: worker.busy,
				taskId: worker.currentTaskId,
			}))
		);
		console.log("Active task:", this.activeTasks.size);
		console.log("Queue length:", this.taskQueue.length);
	}
}
