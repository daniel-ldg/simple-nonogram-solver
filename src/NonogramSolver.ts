import { NonogramSolver } from "./types";

/**
 * Solves a Nonogram puzzle based on the provided row and column hints.
 *
 * @param rowHints - An array of arrays representing the hints for each row.
 * @param columnHints - An array of arrays representing the hints for each column.
 * @returns An object indicating the success of the operation and the solved grid
 *          if successful. The grid is represented as a 2D array, where filled
 *          cells are true and empty cells are false. If the puzzle cannot be solved,
 *          it returns { success: false }.
 */
export const solveNonogram: NonogramSolver = ({ rowHints, columnHints }) => {
	const gridWidth = columnHints.length;
	const gridHeight = rowHints.length;

	const grid: number[][] = new Array(gridHeight).fill(null).map(_ => new Array(gridWidth).fill(0));

	let hasChanged = true;
	while (hasChanged) {
		hasChanged = false;

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
 * @returns An array representing the resolved sequence, or null if no valid
 *          configurations are found.
 */
const resolveSequence = (hintValues: number[], currentSequence: number[]): number[] | null => {
	const validPatterns: number[][] = [];

	for (const pattern of generatePermutations(hintValues, currentSequence)) {
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

	// Handle impossible cases
	if (validPatterns.length === 0) {
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
 * @returns A generator yielding arrays of numbers representing valid
 *          configurations of filled (1) and empty (2) cells based on the provided hints.
 */
const generatePermutations = function* (
	hintValues: number[],
	remaining: number[],
	offset: number = 0
): Generator<number[]> {
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
					1
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
}
