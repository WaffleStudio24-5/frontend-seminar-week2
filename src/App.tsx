import "./App.css";
import { useEffect, useState } from "react";

type Board = number[][];

type RowMoveResult = {
  row: number[];
  gainedScore: number;
};

type MoveResult = {
  board: Board;
  gainedScore: number;
};

type SavedGame = {
  board: Board;
  score: number;
  isFinished: boolean;
};

const STORAGE_KEY = "my-2048-game";

function loadSavedGame(): SavedGame | null {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (savedText === null) {
      return null;
    }

    return JSON.parse(savedText) as SavedGame;
  } catch {
    return null;
  }
}

const savedGame = loadSavedGame();

function createEmptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

function addRandomTile(board: Board): Board {
  const newBoard = board.map((row) => [...row]);
  const emptyCells: [number, number][] = [];

  newBoard.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        emptyCells.push([rowIndex, columnIndex]);
      }
    });
  });
  if (emptyCells.length === 0) return newBoard;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [rowIndex, columnIndex] = emptyCells[randomIndex];
  newBoard[rowIndex][columnIndex] = Math.random() < 0.9 ? 2 : 4;

  return newBoard;
}

function createNewBoard(): Board {
  const emptyBoard = createEmptyBoard();
  const boardWithFirstTile = addRandomTile(emptyBoard);

  return addRandomTile(boardWithFirstTile);
}

function moveRowLeft(row: number[]):RowMoveResult {
  const numbersOnly = row.filter((value) => value !== 0);
  const mergedRow: number[] = [];
  let gainedScore = 0;

  for (let index = 0; index < numbersOnly.length; index += 1) {
    if (numbersOnly[index] === numbersOnly[index + 1]) {
      const newValue = numbersOnly[index] * 2;
      mergedRow.push(newValue);
      gainedScore += newValue;
      index += 1;
    } else {
      mergedRow.push(numbersOnly[index]);
    }
  }

  while (mergedRow.length < 4) {
    mergedRow.push(0);
  }

  return {
    row: mergedRow,
    gainedScore,
  };
}

function moveLeft(board: Board): MoveResult {
  let gainedScore = 0;
  const movedBoard = board.map((row) => {
    const result = moveRowLeft(row);
    gainedScore += result.gainedScore;
    return result.row;
  });
  return {
    board: movedBoard,
    gainedScore,
  };
}

function moveRight(board: Board): MoveResult {
  let gainedScore = 0;

  const movedBoard = board.map((row) => {
    const reversedRow = [...row].reverse();
    const result = moveRowLeft(reversedRow);

    gainedScore += result.gainedScore;

    return result.row.reverse();
  });

  return {
    board: movedBoard,
    gainedScore,
  };
}

function transpose(board: Board): Board {
  return board[0].map((_, columnIndex) =>
    board.map((row) => row[columnIndex]),
  );
}

function moveUp(board: Board): MoveResult {
  const transposedBoard = transpose(board);
  const result = moveLeft(transposedBoard);

  return {
    board: transpose(result.board),
    gainedScore: result.gainedScore,
  };
}

function moveDown(board: Board): MoveResult {
  const transposedBoard = transpose(board);
  const result = moveRight(transposedBoard);

  return {
    board: transpose(result.board),
    gainedScore: result.gainedScore,
  };
}

function has128(board: Board): boolean {
  return board.some((row) => row.includes(128));
}

function isSameBoard(firstBoard: Board, secondBoard: Board): boolean {
  return firstBoard.every((row, rowIndex) =>
    row.every(
      (value, columnIndex) =>
        value === secondBoard[rowIndex][columnIndex],
    ),
  );
}

export default function App() {
  const [board, setBoard] = useState<Board>(() => {
  return savedGame?.board ?? createNewBoard();
});

const [isFinished, setIsFinished] = useState(() => {
  return savedGame?.isFinished ?? false;
});

const [score, setScore] = useState(() => {
  return savedGame?.score ?? 0;
});

  function startNewGame() {
    setBoard(createNewBoard());
    setIsFinished(false);
    setScore(0);
  }

  useEffect(() => {
    if (has128(board)) {
      setIsFinished(true);
    }
  }, [board]);

   useEffect(() => {
  const gameToSave: SavedGame = {
    board,
    score,
    isFinished,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameToSave));
}, [board, score, isFinished]);

  useEffect(() => {
  if (isFinished) return;

  function handleKeyDown(event: KeyboardEvent) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }
    event.preventDefault();

    let result: MoveResult;

if (event.key === "ArrowLeft") {
  result = moveLeft(board);
} else if (event.key === "ArrowRight") {
  result = moveRight(board);
} else if (event.key === "ArrowUp") {
  result = moveUp(board);
} else {
  result = moveDown(board);
}

if (isSameBoard(board, result.board)) {
  return;
}

setBoard(addRandomTile(result.board));
setScore((currentScore) => currentScore + result.gainedScore);
  }
   window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [board, isFinished]);

  return (
    <main>
      <h1>2048</h1>
      <p>점수: {score}</p>
      <button onClick={startNewGame}>새 게임</button>
      <div className="board">
        {board.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => (
            <div className={`tile tile-${value}`} key={`${rowIndex}-${columnIndex}`}>
              {value === 0 ? "" : value}
            </div>
          )),
        )}
      </div>
      {isFinished && <p>128 완성! 게임 종료 🎉</p>}
    </main>
  );
}