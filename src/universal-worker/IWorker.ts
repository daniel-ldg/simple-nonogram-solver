export interface WorkerEvent<T = any> {
	data: T;
	target: IUniversalWorker;
}

export type WorkerEventListener<T = any> = (event: WorkerEvent<T>) => void;

export interface IUniversalWorker {
	postMessage(message: any, transfer?: Transferable[]): void;
	terminate(): void;
	addEventListener(type: string, listener: WorkerEventListener): void;
	removeEventListener(type: string, listener: WorkerEventListener): void;
}

export interface IUniversalWorkerFactory {
	createWorker(): IUniversalWorker;
	getAvailableParallelism(): number;
}
