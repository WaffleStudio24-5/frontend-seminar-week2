import "./App.css";
import { useState, useEffect } from 'react';
import GameMap from "./GameMap";
import { initializeMap, moveMapIn2048Rule, addNewCell, findMaxInMap, userLoses, 
  type Map2048, type Direction} from "./map";

type GameStatus = "PLAYING" | "GAMEOVER" | "CLEAR";
const GAME_STORAGE_KEY = "waffle-t99d99t99t99-2048-game-state";
const HIGH_SCORE_STORAGE_KEY = "waffle-t99d99t99t99-2048-high-score";

type SavedGame = {
  moves: MoveRecord[];
  gameStatus: GameStatus;
};

export class MoveRecord {
  map2048: Map2048;
  score: number;

  constructor(_map2048: Map2048 | null = null, _score: number = 0) {
    this.map2048 = _map2048 ? _map2048 : initializeMap();
    this.score = _score;
  }
};

function loadGame(): SavedGame | null {
  try {
    const savedGame = localStorage.getItem(GAME_STORAGE_KEY);
    if (!savedGame) return null;

    const parsedGame: unknown = JSON.parse(savedGame);
    if (!isSavedGame(parsedGame)) return null;

    return parsedGame;
  } catch {
    // 비정상적인 데이터의 경우 게임을 새로 시작
    return null;
  }
}

function loadHighScore(currentScore: number): number {
  try {
    const savedHighScore = Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY));
    return Number.isFinite(savedHighScore) && savedHighScore >= 0
      ? Math.max(savedHighScore, currentScore)
      : currentScore;
  } catch {
    return currentScore;
  }
}

function isSavedGame(value: unknown): value is SavedGame {
  if (!value || typeof value !== "object") return false;

  const game = value as { moves?: unknown; gameStatus?: unknown };
  return (
    Array.isArray(game.moves) &&
    game.moves.length > 0 &&
    game.moves.every(
      (move) =>
        typeof move === "object" &&
        move !== null &&
        typeof (move as MoveRecord).score === "number" &&
        Array.isArray((move as MoveRecord).map2048),
    ) &&
    (game.gameStatus === "PLAYING" ||
      game.gameStatus === "GAMEOVER" ||
      game.gameStatus === "CLEAR")
  );
}

function App() {
  const [savedGame] = useState(loadGame);
  const [moves, setMoves] = useState<MoveRecord[]>(
    () => savedGame?.moves ?? [new MoveRecord()],
  );
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    () => savedGame?.gameStatus ?? "PLAYING",
  );
  const [highScore, setHighScore] = useState(() =>
    loadHighScore(savedGame?.moves.at(-1)?.score ?? 0),
  );
  const [lastMoveWasUndo, setLastMoveWasUndo] = useState(false);

  /* 게임 저장 처리기 */
  useEffect(() => {
    try {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ moves, gameStatus }));
    } catch {
      // 저장소에 접근할 수 없더라도 새로 고침 전까지 계속 게임을 플레이할 수 있도록 함
    }
  }, [moves, gameStatus]);

  /* 최고 점수 처리기 */
  useEffect(() => {
    const currentScore = moves[moves.length - 1].score;
    setHighScore((previousHighScore) => Math.max(previousHighScore, currentScore));
  }, [moves]);

  useEffect(() => {
    try {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
    } catch {
      // 저장소에 접근할 수 없더라도 새로 고침 전까지 계속 게임을 플레이할 수 있도록 함
    }
  }, [highScore]);

  /* 이동 결과 처리기 */
  function handleMove(direction: Direction) {
    if (gameStatus !== "PLAYING") return;

    setMoves((moves) => {
      const lastMove = moves[moves.length - 1];
      if (!lastMove) throw new TypeError;

      const moveResult = moveMapIn2048Rule(lastMove.map2048, direction);
      if (!moveResult.isMoved) return moves;

      setLastMoveWasUndo(false);
      
      const mapWithNewCell = addNewCell(moveResult.result);

      const newMoves = moves.slice();
      const newScore = lastMove.score + moveResult.score;
      newMoves.push(new MoveRecord(mapWithNewCell, newScore));

      return newMoves;
    });
  }

  /* 되돌리기 버튼 처리기 */
  function handleUndo() {
    if (moves.length <= 1) return;

    setLastMoveWasUndo(true);
    setMoves((moves) => {
      const newMoves = moves.slice();
      newMoves.pop();
      return newMoves;
    })
  }

  /* 게임 리셋 처리기 */
  function handleReset() {
    setGameStatus("PLAYING");
    setLastMoveWasUndo(false);
    setMoves([new MoveRecord()]);
  }

  /* 패배 감지기 */
  useEffect(() => {
    const currentMove = moves[moves.length - 1];

    if (findMaxInMap(currentMove.map2048) >= 128) {
      setTimeout(() => {
        alert(`Clear! Your score is ${currentMove.score}`);
      }, 100);
      setGameStatus("CLEAR");
      return;
    }

    if (userLoses(currentMove.map2048)) {
      setTimeout(() => {
        alert(`You lose! Your score is ${currentMove.score}`);
      }, 100);

      setGameStatus("GAMEOVER");
    }
  }, [moves]);

  /* 키보드 입력기 생성 */ 
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const directionByKey: Partial<Record<string, Direction>> = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowRight: 'right',
        KeyD: 'right',
        ArrowLeft: 'left',
        KeyA: 'left',
      };
      const direction = directionByKey[e.code];

      if (!direction) return;

      e.preventDefault();
      handleMove(direction);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [gameStatus]);

  return (
    <main>
      <h1>2048 Game</h1>
      <p>
        {gameStatus === "GAMEOVER" && "GAME OVER"}
        {gameStatus === "CLEAR" && "CLEAR!"}
        {gameStatus === "PLAYING" && "PRESS ARROW BUTTONS TO MOVE!"}
      </p>
      <div id="currentScore">Score: {moves[moves.length - 1].score}</div>
      <div id="hiScore">HiScore: {highScore}</div>
      <GameMap moves={moves} lastMoveWasUndo={lastMoveWasUndo} />
      <button id="undoButton" onClick={handleUndo} disabled={gameStatus !== "PLAYING"}>undo</button>
      <button id="resetButton" onClick={handleReset}>Reset</button>
    </main>
  );
}

export default App;
