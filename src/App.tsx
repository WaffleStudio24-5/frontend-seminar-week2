import { useCallback, useEffect, useState } from "react";
import GameScreen from "./GameScreen";
import {
  createGame,
  type Direction,
  type GameState,
  moveGame,
  type RandomValues,
} from "./game";
import { readSavedGame, writeSavedGame } from "./storage";

const directions: Record<string, Direction | undefined> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function randomValues(): RandomValues {
  return { position: Math.random(), value: Math.random() };
}

// 최초 실행 시 저장된 게임을 복원하고, 저장이 없으면 새 게임을 만듭니다.
function initialGame(): GameState {
  try {
    const saved = readSavedGame(window.localStorage);
    if (saved) return saved;
  } catch {
    // 브라우저가 저장 공간 접근을 막아도 게임은 실행할 수 있습니다.
  }
  return createGame(randomValues(), randomValues());
}

export default function App() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const move = useCallback((direction: Direction) => {
    // 난수는 updater 밖에서 한 번 준비합니다. updater는 같은 입력에 같은 결과를 냅니다.
    const random = randomValues();
    setGame((previous) => moveGame(previous, direction, random));
  }, []);

  function restart() {
    setGame(createGame(randomValues(), randomValues()));
  }

  // 선택 A: 게임판·점수·종료 상태가 변경되면 브라우저에 함께 저장합니다.
  useEffect(() => {
    try {
      setStorageAvailable(writeSavedGame(window.localStorage, game));
    } catch {
      setStorageAvailable(false);
    }
  }, [game]);

  // 게임판을 먼저 클릭하지 않아도 방향키로 조작할 수 있습니다.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing)
        return;
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <GameScreen
      board={game.board}
      score={game.score}
      status={game.status}
      onMove={move}
      onRestart={restart}
      storageAvailable={storageAvailable}
    />
  );
}
