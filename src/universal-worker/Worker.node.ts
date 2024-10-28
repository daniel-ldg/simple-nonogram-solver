import { IUniversalWorker, IUniversalWorkerFactory, WorkerEvent, WorkerEventListener } from "./IWorker";
import { Worker, MessagePort } from "worker_threads";
import path from "path";
import os from "os";

const WORKER_PATH = "./workers/SegmentWorker.js";

export class UniversalWorker implements IUniversalWorker {
	private worker: Worker;
	private listeners: Map<string, Set<WorkerEventListener>>;

	constructor(scriptPath: string) {
		this.worker = new Worker(scriptPath);
		this.listeners = new Map();

		// Handle incoming messages
		this.worker.on("message", data => {
			const event: WorkerEvent = {
				data,
				target: this,
			};
			this.dispatchEvent("message", event);
		});

		// Handle errors
		this.worker.on("error", error => {
			const event: WorkerEvent = {
				data: error,
				target: this,
			};
			this.dispatchEvent("error", event);
		});
	}

	postMessage(message: any, transfer?: Transferable[]): void {
		if (transfer) {
			this.worker.postMessage(message, transfer as MessagePort[]);
		} else {
			this.worker.postMessage(message);
		}
	}

	terminate(): void {
		this.worker.terminate();
	}

	addEventListener(type: string, listener: WorkerEventListener): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(listener);
	}

	removeEventListener(type: string, listener: WorkerEventListener): void {
		if (this.listeners.has(type)) {
			this.listeners.get(type)!.delete(listener);
		}
	}

	private dispatchEvent(type: string, event: WorkerEvent): void {
		if (this.listeners.has(type)) {
			this.listeners.get(type)!.forEach(listener => listener(event));
		}
	}
}

export class UniversalWorkerFactory implements IUniversalWorkerFactory {
	createWorker(): IUniversalWorker {
		return new UniversalWorker(path.resolve(__dirname, WORKER_PATH));
	}
	getAvailableParallelism(): number {
		// For Node.js >= 16.7.0
		if (typeof os.availableParallelism === "function") {
			return os.availableParallelism();
		}
		// Fallback for older Node versions
		return os.cpus().length;
	}
}
