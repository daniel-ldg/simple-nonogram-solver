# simple-nonogram-solver

A simple and lightweight Nonogram solver, written in TypeScript. This package provides an efficient solver for Nonogram puzzles based on row and column hints.

## Installation

You can install the package via npm:

```Bash
npm i simple-nonogram-solver
```

## Usage

The package exports a single function, `solveNonogram`, which takes the row and column hints of the Nonogram puzzle and returns either a solution or an indication that no solution could be found. Additionally, you can use `asyncSolveNonogram` for asynchronous solving.

### Synchronous Example

```Typescript
import { solveNonogram } from "simple-nonogram-solver";

const rowHints = [
  [1, 1],  // 2 filled cells in Row 1 (separated by at least one space)
  [3],     // 3 filled cells in Row 2
  [1],     // 1 filled cell in Row 3
];

const columnHints = [
  [2],  // 2 filled cell in Column 1
  [1],  // 1 filled cell in Column 2
  [3],  // 3 filled cell in Column 3
];

// optional mechanism to abort the process if it runs for too long
const controller = new AbortController();
const { signal } = controller;
const timeout = 5000;
setTimeout(() => controller.abort(), timeout)

const result = solveNonogram({ rowHints, columnHints }, signal);

if (result.success) {
  console.log("Solution found:");
  result.grid.forEach(row => console.log(row.map(isFilled => (isFilled ? "■" : "□")).join(" ")));
} else {
  console.log("No solution found.");
}
```

### Asynchronous Example

```Typescript
import { asyncSolveNonogram } from "simple-nonogram-solver";

const rowHints = [
  [1, 1],  // 2 filled cells in Row 1 (separated by at least one space)
  [3],     // 3 filled cells in Row 2
  [1],     // 1 filled cell in Row 3
];

const columnHints = [
  [2],  // 2 filled cell in Column 1
  [1],  // 1 filled cell in Column 2
  [3],  // 3 filled cell in Column 3
];

const timeout = 5000;
asyncSolveNonogram({ rowHints, columnHints }, timeout)
  .then((result) => {
      console.log("Solution found:");
      result.grid.forEach(row => console.log(row.map(isFilled => (isFilled ? "■" : "□")).join(" ")));
  })
  .catch((error) => {
    console.error("Error solving Nonogram:", error);
  });
```

### Expected Output

```
Solution found:
■ □ ■
■ ■ ■
□ □ ■
```

## API

`solveNonogram(input: NonogramSolverInput): NonogramSolverOutput`

The `solveNonogram` function takes the following input:

-   `rowHints: Hints` – an array of arrays representing the row hints.

-   `columnHints: Hints` – an array of arrays representing the column hints.

The function returns one of the following:

1. `SolutionFound`:
    - `success`: `true`
    - `grid`: `SolvedGrid` – the solved grid as a 2D array of boolean values, where true represents a filled cell and false represents an empty cell.
    - `height`: `number` – the height of the grid.
    - `width`: `number` – the width of the grid.
2. `NoSolutionFound`:
    - `success`: `false` – indicates the puzzle could not be solved.

## Types

```Typescript
export type NonogramSolver = (input: NonogramSolverInput) => NonogramSolverOutput;

export type NonogramSolverAsync = (
	input: NonogramSolverInput,
	msTimeout?: number
) => Promise<Omit<SolutionFound, "success">>;

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
```

## Performance Considerations

### Long Running Times and Memory Usage

The `solveNonogram` function is designed to iteratively solve Nonogram puzzles by processing row and column hints and updating the grid. However, depending on the complexity of the puzzle (size of the grid, difficulty of hints), this function can:

-   **Run for extended periods of time:** In certain edge cases, such as ambiguous or very large puzzles, the solving process may take a long time, potentially leading to performance bottlenecks.
-   **Consume a significant amount of memory:** Since the grid and its intermediate states are stored in memory, larger puzzles may result in high memory usage during the solving process.

### Mitigating Risks

To prevent indefinite execution or excessive resource usage, you may:

-   Use the `AbortController` API to stop the function if needed.
-   Consider setting limits on the maximum grid size and complexity.

## Attribution

The algorithm used in this solver is heavily based on a Reddit [comment](https://www.reddit.com/r/dailyprogrammer/comments/am1x6o/comment/efk7vl7/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) by Gprime5.
