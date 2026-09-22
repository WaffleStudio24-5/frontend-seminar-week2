import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

// 과제의 128 종료 조건에 맞추려면 128로 변경하세요.
const TARGET = 2048;
const MOVE_MS = 160;
const SIZE = 4;

type Direction = "left" | "right" | "up" | "down";
type Status = "playing" | "won" | "lost";

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
};

type Game = {
  tiles: Tile[];
  score: number;
  status: Status;
};

const CELLS = Array.from({ length: SIZE * SIZE }, (_, index) => ({
  id: index,
  row: Math.floor(index / SIZE),
  col: index % SIZE,
}));

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

// 이동 방향을 기준으로 각 줄의 좌표를 구합니다.
function getPosition(
  direction: Direction,
  line: number,
  position: number,
) {
  switch (direction) {
    case "left":
      return { row: line, col: position };
    case "right":
      return { row: line, col: SIZE - 1 - position };
    case "up":
      return { row: position, col: line };
    case "down":
      return { row: SIZE - 1 - position, col: line };
  }
}

// 빈 칸 하나에 2 또는 4를 생성합니다.
function spawnTile(tiles: Tile[], id: number): Tile[] {
  const emptyCells = CELLS.filter(
    (cell) =>
      !tiles.some(
        (tile) => tile.row === cell.row && tile.col === cell.col,
      ),
  );

  if (emptyCells.length === 0) {
    return tiles;
  }

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  if (!cell) {
    return tiles;
  }

  return [
    ...tiles,
    {
      id,
      value: Math.random() < 0.9 ? 2 : 4,
      row: cell.row,
      col: cell.col,
    },
  ];
}

// 빈 칸이나 합칠 수 있는 이웃이 있으면 계속 플레이할 수 있습니다.
function canMove(tiles: Tile[]): boolean {
  if (tiles.length < SIZE * SIZE) {
    return true;
  }

  return tiles.some((tile) =>
    tiles.some(
      (other) =>
        other.value === tile.value &&
        Math.abs(other.row - tile.row) +
          Math.abs(other.col - tile.col) ===
          1,
    ),
  );
}

// 애니메이션용 위치와 이동 완료 후의 타일을 따로 계산합니다.
function calculateMove(tiles: Tile[], direction: Direction) {
  const moving: Tile[] = [];
  const settled: Tile[] = [];
  let gainedScore = 0;
  let changed = false;

  for (let line = 0; line < SIZE; line += 1) {
    const lineTiles: Tile[] = [];

    // 이동 방향의 앞쪽부터 타일을 수집합니다.
    for (let position = 0; position < SIZE; position += 1) {
      const point = getPosition(direction, line, position);
      const tile = tiles.find(
        (item) => item.row === point.row && item.col === point.col,
      );

      if (tile) {
        lineTiles.push(tile);
      }
    }

    let sourceIndex = 0;
    let targetIndex = 0;

    while (sourceIndex < lineTiles.length) {
      const first = lineTiles[sourceIndex];

      if (!first) {
        break;
      }

      const second = lineTiles[sourceIndex + 1];
      const destination = getPosition(direction, line, targetIndex);

      if (
        first.row !== destination.row ||
        first.col !== destination.col
      ) {
        changed = true;
      }

      // 첫 번째 타일은 목적지로 이동합니다.
      moving.push({ ...first, ...destination });

      if (second && first.value === second.value) {
        // 두 번째 타일도 같은 목적지로 이동한 다음 합쳐집니다.
        moving.push({ ...second, ...destination });

        const mergedValue = first.value * 2;

        settled.push({
          ...first,
          ...destination,
          value: mergedValue,
        });

        gainedScore += mergedValue;
        changed = true;

        // 두 타일을 함께 소비하므로 한 턴에 중복 합병되지 않습니다.
        sourceIndex += 2;
      } else {
        settled.push({ ...first, ...destination });
        sourceIndex += 1;
      }

      targetIndex += 1;
    }
  }

  return { moving, settled, gainedScore, changed };
}

export default function App() {
  const [game, setGame] = useState<Game>({
    tiles: [],
    score: 0,
    status: "playing",
  });

  // 이벤트에서 최신 게임 상태를 즉시 확인하기 위한 Ref입니다.
  const gameRef = useRef<Game>({
    tiles: [],
    score: 0,
    status: "playing",
  });

  const nextIdRef = useRef(1);
  const movingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const updateGame = useCallback((nextGame: Game) => {
    gameRef.current = nextGame;
    setGame(nextGame);
  }, []);

  const startNewGame = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    movingRef.current = false;

    // ID를 재사용하지 않아서 새 게임에서 이전 타일이 움직이지 않습니다.
    let tiles = spawnTile([], nextIdRef.current++);
    tiles = spawnTile(tiles, nextIdRef.current++);

    updateGame({
      tiles,
      score: 0,
      status: "playing",
    });
  }, [updateGame]);

  const move = useCallback(
    (direction: Direction) => {
      const current = gameRef.current;

      // 이동 중 연속 입력과 게임 종료 후 입력을 막습니다.
      if (
        movingRef.current ||
        current.status !== "playing" ||
        current.tiles.length === 0
      ) {
        return;
      }

      const result = calculateMove(current.tiles, direction);

      // 실제로 움직이지 않았다면 새 타일도 생성하지 않습니다.
      if (!result.changed) {
        return;
      }

      movingRef.current = true;

      // 타일 ID를 유지하면서 좌표만 바꿔 CSS 이동을 실행합니다.
      updateGame({
        ...current,
        tiles: result.moving,
      });

      timerRef.current = window.setTimeout(() => {
        const won = result.settled.some(
          (tile) => tile.value >= TARGET,
        );

        const nextTiles = won
          ? result.settled
          : spawnTile(result.settled, nextIdRef.current++);

        let status: Status = "playing";

        if (won) {
          status = "won";
        } else if (!canMove(nextTiles)) {
          status = "lost";
        }

        updateGame({
          tiles: nextTiles,
          score: current.score + result.gainedScore,
          status,
        });

        movingRef.current = false;
        timerRef.current = null;
      }, MOVE_MS + 40);
    },
    [updateGame],
  );

  useEffect(() => {
    startNewGame();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      movingRef.current = false;
    };
  }, [startNewGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key];

      if (!direction || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      // 방향키를 눌렀을 때 페이지가 스크롤되는 것을 막습니다.
      event.preventDefault();
      move(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [move]);
  
  return (
    <main className="game-page">
      <header className="game-header">
        <div>
          <p className="eyebrow">MINI GAME - JHP</p>
          <h1>{TARGET}</h1>
        </div>

        <div className="score-card">
          <span>SCORE</span>
          <strong aria-live="polite">
            {game.score.toLocaleString("ko-KR")}
          </strong>
        </div>
      </header>

      <div className="game-toolbar">
        <p>
          같은 숫자를 합쳐 <strong>{TARGET}</strong>을 만들어 보세요.
        </p>

        <button
          type="button"
          className="new-game-button"
          onClick={startNewGame}
        >
          새 게임
        </button>
      </div>

      <section className="board" aria-label={`${TARGET} 게임판`}>
        <div className="board-inner">
          <div className="board-background" aria-hidden="true">
            {CELLS.map((cell) => (
              <div className="empty-cell" key={cell.id} />
            ))}
          </div>

          {game.tiles.map((tile) => (
            <div
              key={tile.id}
              className="tile"
              style={{
                transform: `translate(
                  calc(${tile.col * 100}% + ${tile.col * 10}px),
                  calc(${tile.row * 100}% + ${tile.row * 10}px)
                )`,
                transitionDuration: `${MOVE_MS}ms`,
              }}
            >
              <div
                className={`tile-face tile-${tile.value}`}
                aria-label={`${tile.row + 1}행 ${tile.col + 1}열, ${tile.value}`}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {game.status !== "playing" && (
          <div className="game-overlay" role="status">
            <p className="overlay-label">
              {game.status === "won" ? "WELL DONE!" : "TRY AGAIN"}
            </p>

            <h2>
              {game.status === "won"
                ? `${TARGET} 달성!`
                : "게임 종료"}
            </h2>

            <p>최종 점수 {game.score.toLocaleString("ko-KR")}점</p>

            <button
              type="button"
              className="new-game-button"
              onClick={startNewGame}
            >
              다시 시작
            </button>
          </div>
        )}
      </section>

      <section className="instructions">
        <h2>HOW TO PLAY</h2>
        <p>
          키보드 방향키로 움직이세요.
          같은 숫자 두 개가 만나면 하나로 합쳐집니다!
        </p>
        <p>
          합쳐진 숫자만큼 점수가 올라갑니다.
          더 이상 움직일 수 없으면 게임이 끝납니다.
        </p>
      </section>

    </main>
  );
}