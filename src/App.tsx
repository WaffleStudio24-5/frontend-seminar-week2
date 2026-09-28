import { useEffect, useState } from "react";
import "./App.css";
import {
  addNewCell,
  findMaxInMap,
  initializeMap,
  type Map2048,
  moveMapIn2048Rule,
} from "./map";

const savedMap = localStorage.getItem("map");
const savedScore = localStorage.getItem("score");

function App() {
  const [map, setMap] = useState<Map2048>(() =>
    savedMap ? JSON.parse(savedMap) : initializeMap(),
  );
  const [score, setScore] = useState(() =>
    savedScore ? Number(savedScore) : 0,
  );
  const [previousMap, setPreviousMap] = useState<Map2048 | null>(null);
  const [previousScore, setPreviousScore] = useState(0);

  const isGameOver = findMaxInMap(map) >= 128;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver) return;

      const directions = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      } as const;

      const direction = directions[event.key as keyof typeof directions];
      if (!direction) return;

      const {
        result,
        isMoved,
        score: earnedScore,
      } = moveMapIn2048Rule(map, direction);

      if (isMoved) {
        setPreviousMap(map);
        setPreviousScore(score);
        setMap(addNewCell(result));
        setScore((previousScore) => previousScore + earnedScore);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, score, isGameOver]);

  useEffect(() => {
    localStorage.setItem("map", JSON.stringify(map));
    localStorage.setItem("score", String(score));
  }, [map, score]);

  const handleUndo = () => {
    if (!previousMap) return;

    setMap(previousMap);
    setScore(previousScore);
    setPreviousMap(null);
  };

  return (
    <main>
      <h1>2048</h1>
      <p>Score: {score}</p>

      <button type="button" onClick={handleUndo} disabled={!previousMap}>
        Undo
      </button>

      <div className="game-board">
        {map.flat().map((cell, index) => (
          <div
            className={`cell ${cell ? `cell-${cell.value}` : ""}`}
            // biome-ignore lint/suspicious/noArrayIndexKey: Grid positions are fixed.
            key={index}
          >
            {cell?.value}
          </div>
        ))}
      </div>

      {isGameOver && <p>Game Over!</p>}
    </main>
  );
}

export default App;
