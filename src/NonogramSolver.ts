import { NonogramSolver, NonogramSolverAsync, SolutionFound } from "./types";

/**
 * Solves a Nonogram puzzle based on row and column hints, with optional support
 * for an abort signal to cancel the solving operation.
 *
 * @param rowHints - An array of arrays representing the hints for each row.
 * @param columnHints - An array of arrays representing the hints for each column.
 * @param signal - An optional AbortSignal that allows the operation to be cancelled.
 *                 If the signal is triggered, the function will return a failure
 *                 with reason "Operation aborted".
 * @returns An object indicating the success of the operation, the solved grid if
 *          successful, or a failure object if the puzzle cannot be solved or if
 *          the operation is aborted.
 */
export const solveNonogram: NonogramSolver = ({ rowHints, columnHints }, signal?: AbortSignal) => {
	const gridWidth = columnHints.length;
	const gridHeight = rowHints.length;

	const grid: number[][] = new Array(gridHeight).fill(null).map(_ => new Array(gridWidth).fill(0));

	let hasChanged = true;

	while (hasChanged) {
		hasChanged = false;

		// Check for abort signal
		if (signal?.aborted) {
			return { success: false, reason: "Operation aborted" };
		}

		// Solve rows
		for (let y = 0; y < rowHints.length; y++) {
			const rowHint = rowHints[y];
			const resolvedRow = resolveSequence(rowHint, grid[y]);

			if (resolvedRow === null) {
				// If any row is unsolvable, return an indication of failure
				return { success: false };
			}

			resolvedRow.forEach((cellValue, x) => {
				if (cellValue && grid[y][x] !== cellValue) hasChanged = true;
				grid[y][x] = cellValue;
			});
		}

		// Solve columns
		for (let x = 0; x < columnHints.length; x++) {
			const colHint = columnHints[x];
			const resolvedColumn = resolveSequence(
				colHint,
				grid.map(row => row[x])
			);

			if (resolvedColumn === null) {
				// If any column is unsolvable, return an indication of failure
				return { success: false };
			}

			resolvedColumn.forEach((cellValue, y) => {
				if (cellValue && grid[y][x] !== cellValue) hasChanged = true;
				grid[y][x] = cellValue;
			});
		}
	}

	const formatedGrid = grid.map(row => row.map(cell => cell === 2));

	return {
		success: true,
		grid: formatedGrid,
		height: gridHeight,
		width: gridWidth,
	};
};

/**
 * Resolves a sequence of hints by generating valid patterns and comparing them
 * against the current sequence to find consistent configurations.
 *
 * @param hintValues - An array of numbers representing the lengths of the filled
 *                    segments (hints).
 * @param currentSequence - An array representing the current state of the sequence,
 *                         where 0 indicates empty cells and other values indicate
 *                         filled cells.
 * @param signal - An optional AbortSignal that allows the operation to be cancelled.
 * @returns An array representing the resolved sequence, or null if no valid
 *          configurations are found.
 */
const resolveSequence = (hintValues: number[], currentSequence: number[], signal?: AbortSignal): number[] | null => {
	const validPatterns: number[][] = [];

	for (const pattern of generatePermutations(hintValues, currentSequence, 0, signal)) {
		const completedPattern = pattern.concat(new Array(currentSequence.length - pattern.length).fill(1));
		let isValid = true;

		for (let index = 0; index < currentSequence.length; index++) {
			if (currentSequence[index] > 0 && currentSequence[index] !== completedPattern[index]) {
				isValid = false;
				break;
			}
		}
		if (isValid) validPatterns.push(completedPattern);
	}

	// Handle abortion and impossible cases
	if (signal?.aborted || validPatterns.length === 0) {
		return null;
	}

	let resolvedSequence = validPatterns[0] || [];
	for (const pattern of validPatterns.slice(1)) {
		resolvedSequence = resolvedSequence.map((cellValue, idx) => (cellValue === pattern[idx] ? cellValue : 0));
	}

	return resolvedSequence;
};

/**
 * Generates all possible permutations of hints for a Nonogram puzzle.
 *
 * @param hintValues - An array of numbers representing the lengths of the filled
 *                    segments (hints) in the Nonogram.
 * @param remaining - An array representing the remaining available spaces for
 *                    placing the hints.
 * @param offset - An optional parameter indicating the starting position for
 *                 the permutation, defaulting to 0.
 * @param signal - An optional AbortSignal that allows the operation to be cancelled.
 * @returns A generator yielding arrays of numbers representing valid
 *          configurations of filled (1) and empty (2) cells based on the provided hints.
 */
const generatePermutations = function* (
	hintValues: number[],
	remaining: number[],
	offset: number = 0,
	signal?: AbortSignal
): Generator<number[]> {
	// Check for abort signal
	if (signal?.aborted) {
		return; // stop generator execution
	}
	if (hintValues && hintValues.length && hintValues[0]) {
		const [currentHint, ...remainingHints] = hintValues;
		const sumOfRemainingHints = remainingHints.reduce((acc, curr) => acc + curr, 0);

		for (
			let position = 0;
			position <= remaining.length - currentHint - sumOfRemainingHints - remainingHints.length;
			position++
		) {
			if (!remaining.slice(position, position + currentHint).includes(1)) {
				for (const subsequentPermutation of generatePermutations(
					remainingHints,
					remaining.slice(position + currentHint + 1),
					1,
					signal
				)) {
					yield new Array(position + offset)
						.fill(1)
						.concat(new Array(currentHint).fill(2))
						.concat(subsequentPermutation);
				}
			}
		}
	} else {
		yield [];
	}
};

/**
 * Asynchronously solves a Nonogram puzzle with an optional timeout feature.
 *
 * @param input - An object containing the row and column hints for the Nonogram.
 * @param timeout - An optional timeout duration in milliseconds. If specified,
 *                  the promise will reject if the solving operation takes longer
 *                  than this duration.
 * @returns A Promise that resolves to the solution of the Nonogram if successful,
 *          or rejects with an error message if no solution exists or if the
 *          operation times out.
 */
export const asyncSolveNonogram: NonogramSolverAsync = (input, timeout = 0) => {
	const controller = new AbortController();
	const { signal } = controller;
	const solutionPromise = new Promise<SolutionFound>((resolve, reject) => {
		const { success, ...solution } = solveNonogram(input, signal);
		if (success) {
			resolve(solution as SolutionFound);
		} else {
			reject("no solution");
		}
	});
	if (timeout === 0) {
		return solutionPromise;
	} else {
		const timeoutPromise = new Promise<SolutionFound>((_, reject) =>
			setTimeout(() => {
				reject(new Error("Operation timed out"));
				controller.abort();
			}, timeout)
		);
		return Promise.race([solutionPromise, timeoutPromise]);
	}
};
