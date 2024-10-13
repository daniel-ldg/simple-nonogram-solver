export type NonogramSolver = (input: NonogramSolverInput) => NonogramSolverOutput;

export type NonogramSolverInput = {
	rowHints: Hints;
	columnHints: Hints;
};

export type NonogramSolverOutput = SolutionFound | NoSolutionFound;

export type SolutionFound = {
	success: true;
	grid: SolvedGrid;
	height: number;
	width: number;
};

export type NoSolutionFound = {
	success: false;
};

export type SolvedGrid = boolean[][];
export type Hints = number[][];
