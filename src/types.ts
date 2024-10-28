export type Cell = 0 | 1 | 2; // 0: unknown, 1: empty, 2: filled
export type Grid = Cell[][];

export type NonogramSolver = (hints: NonogramHints, options?: NonogramSolverOptions) => Promise<boolean[][]>;

export type NonogramHints = {
	rowsHints: number[][];
	columnsHints: number[][];
};

export type NonogramSolverOptions = {
	maxIterations?: number;
};
