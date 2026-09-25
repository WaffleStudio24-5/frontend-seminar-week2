import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  addNewCell,
  findMaxInMap,
  initializeMap,
  moveMapIn2048Rule,
} from "./map";
import type { Direction, Map2048 } from "./map";

type GameStatus = "playing" | "won" | "lost";

type GameSnapshot = {
  board: Map2048;
  score: number;
  status: GameStatus;
};

const STORAGE_KEY = "waffle-2048-game";

const directionByKey: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const createNewGame = (): GameSnapshot => ({
  board: initializeMap(),
  score: 0,
  status: "playing",
});

const copyBoard = (board: Map2048): Map2048 =>
  board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

const isGameOver = (board: Map2048) => {
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const current = board[row][column];

      if (current === null) return false;

      const right = board[row][column + 1];
      const below = board[row + 1]?.[column];

      if (right?.value === current.value || below?.value === current.value) {
        return false;
      }
    }
  }

  return true;
};

const getSavedGame = (): GameSnapshot => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return createNewGame();

    const parsed = JSON.parse(saved) as GameSnapshot;

    if (
      Array.isArray(parsed.board) &&
      typeof parsed.score === "number" &&
      ["playing", "won", "lost"].includes(parsed.status)
    ) {
      return parsed;
    }
  } catch {
    // 저장된 데이터가 손상되어 있으면 새 게임을 시작합니다.
  }

  return createNewGame();
};

const getStatusText = (status: GameStatus) => {
  if (status === "won") return "128 달성";
  if (status === "lost") return "게임 종료";
  return "게임 진행 중";
};

function App() {
  const [game, setGame] = useState<GameSnapshot>(getSavedGame);
  const [previousGame, setPreviousGame] = useState<GameSnapshot | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (game.status !== "playing") return;

      const { result, isMoved, score: earnedScore } = moveMapIn2048Rule(
        game.board,
        direction,
      );

      if (!isMoved) return;

      const nextBoard = addNewCell(result);
      const nextScore = game.score + earnedScore;

      let nextStatus: GameStatus = "playing";

      if (findMaxInMap(nextBoard) >= 128) {
        nextStatus = "won";
      } else if (isGameOver(nextBoard)) {
        nextStatus = "lost";
      }

      setPreviousGame({
        board: copyBoard(game.board),
        score: game.score,
        status: game.status,
      });

      setGame({
        board: nextBoard,
        score: nextScore,
        status: nextStatus,
      });
    },
    [game],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = directionByKey[event.key];

      if (!direction) return;

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMove]);

  const handleRestart = () => {
    setGame(createNewGame());
    setPreviousGame(null);
  };

  const handleUndo = () => {
    if (!previousGame) return;

    setGame({
      board: copyBoard(previousGame.board),
      score: previousGame.score,
      status: previousGame.status,
    });
    setPreviousGame(null);
  };

  return (
    <main className="game-app">
      <section className="game-shell" aria-label="2048 게임">
        <header className="game-header">
          <div>
            <p className="eyebrow">WAFFLE FRONTEND SEMINAR</p>
            <h1>2048</h1>
            <p className="game-description">
              같은 숫자를 합쳐 128 타일을 만들어보세요.
            </p>
          </div>

          <div className="score-card" aria-label={`현재 점수 ${game.score}`}>
            <span>SCORE</span>
            <strong>{game.score.toLocaleString()}</strong>
          </div>
        </header>

        <div className="game-toolbar">
          <p className={`status status-${game.status}`}>
            <span className="status-dot" />
            {getStatusText(game.status)}
          </p>

          <div className="button-group">
            <button
              className="button button-secondary"
              type="button"
              onClick={handleUndo}
              disabled={!previousGame}
            >
              Undo
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={handleRestart}
            >
              새 게임
            </button>
          </div>
        </div>

        <div className="board" aria-label="2048 게임판">
          {game.board.flatMap((row, rowIndex) =>
            row.map((cell, columnIndex) => (
              <div
                className={[
                  "cell",
                  cell ? "tile" : "cell-empty",
                  cell ? `tile-${cell.value}` : "",
                  cell?.state === "new" ? "tile-new" : "",
                  cell?.state === "merged" ? "tile-merged" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`${rowIndex}-${columnIndex}`}
              >
                {cell?.value}
              </div>
            )),
          )}

          {game.status !== "playing" && (
            <div className="game-result">
              <div className="game-result-content">
                <p>{game.status === "won" ? "Congratulations" : "Game Over"}</p>
                <h2>
                  {game.status === "won"
                    ? "128 타일을 만들었어요!"
                    : "더 이상 움직일 수 없어요"}
                </h2>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleRestart}
                >
                  다시 시작
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="guide">
          키보드 <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd> 로 타일을
          움직일 수 있어요.
        </p>
      </section>
    </main>
  );
}

export default App;