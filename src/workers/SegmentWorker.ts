import { Cell } from "../types";

export type SegmentSolver = (input: SegmentSolverInput) => SegmentSolverOutput;

export type SegmentSolverInput = { hints: number[]; segment: Cell[] };

export type SegmentSolverOutput = Cell[];

export type SegmentWorkerMessage = {
	type: "SOLVE";
	payload: SegmentSolverInput;
	taskId: string; // Added for task tracking
};

export type SegmentWorkerResponse = {
	type: "RESULT";
	payload: SegmentSolverOutput;
	taskId: string; // Added for task tracking
};

if (process.env.RUNTIME === "node") {
	const { parentPort } = require("worker_threads");

	parentPort?.on("message", (message: SegmentWorkerMessage) => {
		const response = handleMessage(message);
		parentPort?.postMessage(response);
	});
} else {
	self.addEventListener("message", (event: MessageEvent<SegmentWorkerMessage>) => {
		const response = handleMessage(event.data);
		self.postMessage(response);
	});
}

const handleMessage = (event: SegmentWorkerMessage): SegmentWorkerResponse | undefined => {
	const { type, payload, taskId } = event;

	if (type === "SOLVE") {
		const result = resolveSequence(payload);

		const response: SegmentWorkerResponse = {
			type: "RESULT",
			payload: result,
			taskId,
		};

		return response;
	}
};

// Cache for memoization using closure
const memoCache = new Map<string, boolean>();

const getCacheKey = (hints: number[], segment: Cell[], startIndex: number): string =>
	`${hints.join(",")}-${segment.join(",")}-${startIndex}`;

const resolveSequence: SegmentSolver = ({ hints, segment }) => {
	// Quick validation
	const totalFilled = hints.reduce((sum, hint) => sum + hint, 0);
	const minSpace = getMinSpaceNeeded(hints);
	const existingFilled = segment.filter(cell => cell === 2).length;

	if (minSpace > segment.length || existingFilled > totalFilled) {
		throw new Error("Segment not possible to solve");
	}

	// Clear memoization cache for new sequence
	memoCache.clear();

	// Validate if the sequence is possible
	if (!canPlaceHints(hints, segment, 0)) {
		throw new Error("Segment not possible to solve");
	}

	// Initialize result array
	const result = [...segment];

	// For each unknown cell, check if it must be filled or empty
	for (let i = 0; i < segment.length; i++) {
		if (segment[i] !== 0) continue; // Skip known cells

		const mustBeFilled = checkMustBe(hints, segment, i, 2);
		const mustBeEmpty = checkMustBe(hints, segment, i, 1);

		if (mustBeFilled && !mustBeEmpty) {
			result[i] = 2;
		} else if (!mustBeFilled && mustBeEmpty) {
			result[i] = 1;
		}
		// If both are possible, leave as unknown (0)
	}

	return result;
};

const canPlaceBlock = (segment: Cell[], start: number, length: number): boolean => {
	// Check if block fits and doesn't violate existing constraints
	if (start + length > segment.length) return false;
	if (start > 0 && segment[start - 1] === 2) return false;
	if (start + length < segment.length && segment[start + length] === 2) return false;

	for (let i = 0; i < length; i++) {
		if (segment[start + i] === 1) return false;
	}
	return true;
};

const getMinSpaceNeeded = (hints: number[]): number =>
	hints.reduce((sum, hint) => sum + hint, 0) + Math.max(0, hints.length - 1);

const canPlaceHints = (hints: number[], segment: Cell[], startIndex: number): boolean => {
	const cacheKey = getCacheKey(hints, segment, startIndex);
	if (memoCache.has(cacheKey)) return memoCache.get(cacheKey)!;

	// Base case: no more hints to place
	if (hints.length === 0) {
		// Check if remaining segment has any filled cells
		const valid = !segment.slice(startIndex).some(cell => cell === 2);
		memoCache.set(cacheKey, valid);
		return valid;
	}

	const [currentHint, ...remainingHints] = hints;
	const maxStart = segment.length - getMinSpaceNeeded(hints);

	for (let i = startIndex; i <= maxStart; i++) {
		if (canPlaceBlock(segment, i, currentHint)) {
			const nextStart = i + currentHint + 1;
			if (canPlaceHints(remainingHints, segment, nextStart)) {
				memoCache.set(cacheKey, true);
				return true;
			}
		}
		// Skip positions that must be filled
		if (segment[i] === 2) break;
	}

	memoCache.set(cacheKey, false);
	return false;
};

const checkMustBe = (hints: number[], segment: Cell[], position: number, value: Cell): boolean => {
	const testSegment = [...segment];
	testSegment[position] = value;
	return canPlaceHints(hints, testSegment, 0);
};
