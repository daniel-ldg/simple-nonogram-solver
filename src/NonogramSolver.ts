import { SegmentWorkerPool } from "./SegmentWorkerPool";
import { Cell, Grid, NonogramSolver, NonogramSolverOptions } from "./types";

const DEFAULT_OPTIONS: Required<NonogramSolverOptions> = {
	maxIterations: 100,
};

export const solveNonogram: NonogramSolver = async (
	{ rowsHints, columnsHints },
	options = {}
): Promise<boolean[][]> => {
	const { maxIterations } = { ...DEFAULT_OPTIONS, ...options };

	// Validate input
	if (!rowsHints.length || !columnsHints.length) {
		throw new Error("Invalid input: Empty hints");
	}

	// Initialize grid with unknowns (0)
	const height = rowsHints.length;
	const width = columnsHints.length;
	let grid: Grid = Array(height)
		.fill(null)
		.map(() => Array(width).fill(0));

	let hasChanges = true;
	let currentIteration = 0;

	const workerPool = new SegmentWorkerPool();

	while (hasChanges && currentIteration < maxIterations) {
		hasChanges = false;
		currentIteration++;

		let processingSegments: Promise<Cell[]>[] = [];

		// Process rows
		for (let rowIndex = 0; rowIndex < height; rowIndex++) {
			const hints = rowsHints[rowIndex];
			const segment = grid[rowIndex];

			processingSegments.push(workerPool.submitTask({ hints, segment }));
		}

		const processedRows = await Promise.all(processingSegments).catch(e => {
			workerPool.terminate();
			throw new NonogramSolverError("Puzzle is unsolvable", e);
		});

		// processingSegments order is preserved to processedRows
		grid.forEach((currentRow, rowIndex) => {
			const newRow = processedRows[rowIndex];
			const isNewRowDiferent = newRow.some((cell, colIndex) => cell !== 0 && currentRow[colIndex] !== cell);
			if (isNewRowDiferent) {
				grid[rowIndex] = newRow;
				hasChanges = true;
			}
		});

		// Process columns
		processingSegments = [];

		const transposedGrid = transpose(grid);

		for (let columnIndex = 0; columnIndex < width; columnIndex++) {
			const hints = columnsHints[columnIndex];
			const segment = transposedGrid[columnIndex];

			processingSegments.push(workerPool.submitTask({ hints, segment }));
		}

		const processedColumns = await Promise.all(processingSegments).catch(e => {
			workerPool.terminate();
			throw new NonogramSolverError("Puzzle is unsolvable", e);
		});

		transposedGrid.forEach((currentColumn, columnIndex) => {
			const newColumn = processedColumns[columnIndex];
			const isNewColumnDiferent = newColumn.some(
				(cell, rowIndex) => cell !== 0 && currentColumn[rowIndex] !== cell
			);

			if (isNewColumnDiferent) {
				transposedGrid[columnIndex] = newColumn;
				hasChanges = true;
			}
		});

		// update grid to new columns
		grid = transpose(transposedGrid);

		// If no changes were made but there are still unknown cells, the puzzle is unsolvable
		if (!hasChanges) {
			const hasUnknowns = grid.some(row => row.some(cell => cell === 0));
			if (hasUnknowns) {
				throw new NonogramSolverError("Puzzle is unsolvable");
			}
		}
	}

	workerPool.terminate();

	if (currentIteration >= maxIterations) {
		throw new NonogramSolverError("Maximum iterations exceeded");
	}

	return grid.map(row => row.map(cell => cell === 2));
};

export class NonogramSolverError extends Error {
	cause: any;
	constructor(message: string, cause?: any) {
		super(message);
		this.name = "NonogramSolverError";
		this.cause = cause;
	}
}

const transpose = (arr: any[][]) => arr[0].map((_, i) => arr.map(row => row[i]));
