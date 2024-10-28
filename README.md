# simple-nonogram-solver

A zero-dependency nonogram (picture logic) puzzle solver that works in both Node.js and browser environments. The solver utilizes parallel processing through Web Workers (browser) or Worker Threads (Node.js) for optimal performance.

## Features

-   🚀 Parallel processing for optimal performance
-   🌐 Works in both Node.js and browser environments
-   📦 Zero dependencies
-   💡 Simple, easy-to-use API
-   ⚡ Asynchronous solving process

## Installation

```bash
npm i simple-nonogram-solver
```

## Usage

```typescript
import { solveNonogram, NonogramSolverError } from "simple-nonogram-solver";

// Define your puzzle hints
const hints = {
	rowsHints: [
		[1, 1], // 2 filled cells in Row 1 (separated by at least one space)
		[3], // 3 filled cells in Row 2
		[1], // 1 filled cell in Row 3
	],
	columnsHints: [
		[2], // 2 filled cell in Column 1
		[1], // 1 filled cell in Column 2
		[3], // 3 filled cell in Column 3
	],
};

// Solve the puzzle
try {
	const solution = await solveNonogram(hints);
	console.log(solution);
	// Returns a 2D array of booleans where:
	// true = filled cell
	// false = empty cell
	// [
	//	[true,false,true]
	//	[true,true,true]
	//	[false,false,true]
	// ]
} catch (error) {
	if (error instanceof NonogramSolverError) {
		console.error("Failed to solve puzzle:", error.message);
	}
}
```

## API Reference

### `solveNonogram(hints, options?)`

Main function to solve nonogram puzzles.

#### Parameters

-   `hints` (required): Object containing row and column hints

    ```typescript
    type NonogramHints = {
    	rowsHints: number[][]; // Array of arrays containing row hints
    	columnsHints: number[][]; // Array of arrays containing column hints
    };
    ```

-   `options` (optional): Solver configuration
    ```typescript
    type NonogramSolverOptions = {
    	maxIterations?: number; // Maximum number of iterations before giving up (default: 100)
    };
    ```

#### Returns

-   Promise<boolean[][]>: 2D array representing the solved puzzle where `true` represents filled cells and `false` represents empty cells.

#### Errors

The solver may throw a `NonogramSolverError` in the following cases:

-   Invalid input (empty hints)
-   Unsolvable puzzle
-   Maximum iterations exceeded

## How It Works

The solver uses a logical approach combined with parallel processing to solve nonogram puzzles efficiently. Here's a detailed explanation of the algorithm:

### Core Concepts

1. Line Solving

    - Each line (row or column) is solved independently using the "line solver" algorithm
    - A line can be partially solved, leaving some cells as "unknown"
    - The solver identifies cells that must be filled or must be empty based on the hints

2. Iteration Process
    - The solver alternates between processing rows and columns
    - Each iteration may reveal new information that helps solve other lines
    - The process continues until either:
        - The puzzle is solved (no unknown cells remain)
        - No changes are made in an iteration (puzzle is unsolvable)
        - Maximum iterations are reached

### Line Solver Algorithm

For each line, the solver:

#### 1. Validates Possibility

```
Given line: [?, ?, ?, ?, ?]  // ? = unknown
Hints: [2, 1]               // blocks of 2 and 1
First check: Is there enough space?
Minimum space needed = 2 + 1 + 1 = 4 (sum of hints + minimum gaps)
```

#### 2. Determines Mandatory Cells

-   For each unknown cell, the solver:
    -   Tests if the cell can be filled
    -   Tests if the cell can be empty
    -   If only one option is possible, marks the cell accordingly

Example:

```
Line: [?, ?, ?, ?, ?]
Hint: [3]

Test positions:
[###__] possible
[_###_] possible
[__###] possible

Overlapping filled region: [_###_]
                             ^^^
Middle cells must be filled
```

#### 3. Uses Dynamic Programming with Memoization

-   The solver caches results of previously tested configurations
-   This significantly speeds up the process for complex lines
-   The cache is cleared for each new line to prevent memory bloat

### Parallel Processing Strategy

#### 1. Worker Pool

-   Maintains a pool of workers sized to the available CPU cores
-   Workers process individual lines concurrently
-   Tasks are queued when all workers are busy

#### 2. Processing Flow

```
Main Thread                 Worker Pool                 Workers
│                              │                          │
├─── Process Rows ────────────►│                          │
│                              ├─── Distribute Tasks ────►│
│                              │                          ├─── Solve Line
│                              │◄─── Return Results ──────┤
│                              │                          │
├─── Process Columns ─────────►│                          │
│                              ├─── Distribute Tasks ────►│
│                              │                          ├─── Solve Line
│                              │◄─── Return Results ──────┤
```

#### 3. Environment Adaptation

-   Node.js: Uses worker_threads for parallel processing
-   Browser: Uses Web Workers
-   Same algorithm runs in both environments

### Example Solving Process

```
Initial:      iteration 1   iteration 2   iteration 3
? ? ? ? ?     ? X ? ? ?     ? X ? ? #     X X X X #
? ? ? ? ?  →  X X X X X  →  X X X X X  →  X X X X X
? ? ? ? ?     ? # ? ? ?     ? # ? X X     ? # # X X
? ? ? ? ?     ? # ? ? ?     ? # ? ? ?     ? # X ? ?
? ? ? ? ?     ? # ? ? ?     ? # ? ? ?     ? # # ? ?

Hints:
Rows: [1], [0], [2], [2,1], [2,1]
Cols: [1], [3], [1,1], [1], [1,1]
```

The solver continues iterating between rows and columns until it reaches a complete solution or determines the puzzle is unsolvable.

## Optimization Techniques

### Early Termination

-   Validates puzzle solvability before detailed processing
-   Stops when no further progress is possible
-   Detects impossible configurations early

### Efficient Memory Usage

-   Clears memoization cache between lines
-   Minimizes object allocation during solving

### Task Management

-   Efficient worker pool management
-   Dynamic task distribution based on available resources
-   Graceful handling of worker failures

## Browser Compatibility

The package works in all modern browsers that support Web Workers. For older browsers, consider adding a Web Worker polyfill.

## Node.js Compatibility

Requires Node.js version 12 or higher for Worker Threads support.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
