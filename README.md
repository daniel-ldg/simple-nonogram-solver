# simple-nonogram-solver

A simple and lightweight Nonogram solver, written in TypeScript. This package provides an efficient solver for Nonogram puzzles based on row and column hints.

### Installation

You can install the package via npm:

```Bash
npm i simple-nonogram-solver
```

### Usage

The package exports a single function, solveNonogram, which takes the row and column hints of the Nonogram puzzle and returns either a solution or an indication that no solution could be found.

```Typescript
import { solveNonogram } from 'simple-nonogram-solver';

const rowHints = [
  [3],
  [1, 1],
  [3]
];

const columnHints = [
  [1],
  [2],
  [1]
];

const result = solveNonogram({ rowHints, columnHints });

if (result.success) {
  console.log('Solution found:');
  console.table(result.grid);
} else {
  console.log('No solution found.');
}
```

### API

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

### Types

```Typescript
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
```

### Attribution

The algorithm used in this solver is heavily based on a Reddit [comment](https://www.reddit.com/r/dailyprogrammer/comments/am1x6o/comment/efk7vl7/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) by Gprime5.
