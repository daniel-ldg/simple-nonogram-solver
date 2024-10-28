import { getWorkerUrl } from "../generated/InlineSegmentWorker";
import { IUniversalWorker, IUniversalWorkerFactory, WorkerEvent, WorkerEventListener } from "./IWorker";

export class UniversalWorker implements IUniversalWorker {
	private worker: Worker;
	private listeners: Map<string, Set<WorkerEventListener>>;

	constructor(scriptUrl: string) {
		this.worker = new Worker(scriptUrl, { type: "module" });
		this.listeners = new Map();

		// Handle incoming messages
		this.worker.onmessage = event => {
			const workerEvent: WorkerEvent = {
				data: event.data,
				target: this,
			};
			this.dispatchEvent("message", workerEvent);
		};

		// Handle errors
		this.worker.onerror = error => {
			const workerEvent: WorkerEvent = {
				data: error,
				target: this,
			};
			this.dispatchEvent("error", workerEvent);
		};
	}

	postMessage(message: any, transfer?: Transferable[]): void {
		if (transfer) {
			this.worker.postMessage(message, transfer);
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
		const workerBlob = getWorkerUrl();
		return new UniversalWorker(workerBlob);
	}
	getAvailableParallelism(): number {
		return navigator.hardwareConcurrency;
	}
}
