export interface Tile {
  id: number;
  value: number; // 1 = A, 2 = B, 3 = C, etc.
  row: number;
  col: number;
  mergedFrom?: [Tile, Tile];
  isNew?: boolean;
}

export interface MergeLettersState {
  grid: (Tile | null)[][];
  score: number;
  gameOver: boolean;
}

let tileIdCounter = 0;

export function createMergeLettersState(): MergeLettersState {
  tileIdCounter = 0;
  const state: MergeLettersState = {
    grid: Array(4).fill(null).map(() => Array(4).fill(null)),
    score: 0,
    gameOver: false,
  };
  addRandomTile(state);
  addRandomTile(state);
  return state;
}

function addRandomTile(state: MergeLettersState) {
  const emptyCells: { row: number; col: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!state.grid[r][c]) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  if (emptyCells.length > 0) {
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    // 90% chance of 'A' (1), 10% chance of 'B' (2)
    const value = Math.random() < 0.9 ? 1 : 2;
    state.grid[cell.row][cell.col] = {
      id: tileIdCounter++,
      value,
      row: cell.row,
      col: cell.col,
      isNew: true,
    };
  }
}

export function moveMergeLetters(
  state: MergeLettersState,
  direction: "up" | "down" | "left" | "right"
): MergeLettersState {
  if (state.gameOver) return state;

  const newState: MergeLettersState = {
    grid: Array(4).fill(null).map(() => Array(4).fill(null)),
    score: state.score,
    gameOver: false,
  };

  // Clear isNew and mergedFrom flags from the previous state
  const oldGrid = state.grid.map((row) => row.map((t) => (t ? { ...t, isNew: false, mergedFrom: undefined } : null)));

  let moved = false;

  const traverse = (
    vector: { x: number; y: number },
    rStart: number,
    rEnd: number,
    rStep: number,
    cStart: number,
    cEnd: number,
    cStep: number
  ) => {
    for (let r = rStart; r !== rEnd; r += rStep) {
      for (let c = cStart; c !== cEnd; c += cStep) {
        const tile = oldGrid[r][c];
        if (tile) {
          let currRow = r;
          let currCol = c;
          let nextRow = currRow + vector.y;
          let nextCol = currCol + vector.x;

          while (
            nextRow >= 0 &&
            nextRow < 4 &&
            nextCol >= 0 &&
            nextCol < 4 &&
            !newState.grid[nextRow][nextCol]
          ) {
            currRow = nextRow;
            currCol = nextCol;
            nextRow += vector.y;
            nextCol += vector.x;
          }

          let nextTile: Tile | null = null;
          if (nextRow >= 0 && nextRow < 4 && nextCol >= 0 && nextCol < 4) {
            nextTile = newState.grid[nextRow][nextCol];
          }

          if (nextTile && nextTile.value === tile.value && !nextTile.mergedFrom) {
            // Merge
            const mergedTile: Tile = {
              id: tileIdCounter++,
              value: tile.value + 1,
              row: nextRow,
              col: nextCol,
              mergedFrom: [nextTile, { ...tile, row: nextRow, col: nextCol }],
            };
            newState.grid[nextRow][nextCol] = mergedTile;
            newState.score += Math.pow(2, mergedTile.value); // Scored based on powers of 2 roughly
            moved = true;
          } else {
            // Move
            if (currRow !== r || currCol !== c) {
              moved = true;
            }
            newState.grid[currRow][currCol] = { ...tile, row: currRow, col: currCol };
          }
        }
      }
    }
  };

  if (direction === "up") {
    traverse({ x: 0, y: -1 }, 0, 4, 1, 0, 4, 1);
  } else if (direction === "down") {
    traverse({ x: 0, y: 1 }, 3, -1, -1, 0, 4, 1);
  } else if (direction === "left") {
    traverse({ x: -1, y: 0 }, 0, 4, 1, 0, 4, 1);
  } else if (direction === "right") {
    traverse({ x: 1, y: 0 }, 0, 4, 1, 3, -1, -1);
  }

  if (moved) {
    addRandomTile(newState);
  } else {
    // If we didn't move, we return the exact original state to ignore the keypress
    return state;
  }

  newState.gameOver = checkGameOver(newState);

  return newState;
}

function checkGameOver(state: MergeLettersState): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!state.grid[r][c]) return false;
      if (r < 3 && state.grid[r + 1][c]?.value === state.grid[r][c]?.value) return false;
      if (c < 3 && state.grid[r][c + 1]?.value === state.grid[r][c]?.value) return false;
    }
  }
  return true;
}

export function getLetterForValue(value: number): string {
  // 1 -> A, 2 -> B, ..., 26 -> Z
  // If > 26, maybe loop back with symbols, or just Z+
  if (value <= 26) {
    return String.fromCharCode(64 + value);
  }
  return String.fromCharCode(64 + 26) + "+";
}
