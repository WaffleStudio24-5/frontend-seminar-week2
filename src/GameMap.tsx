import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Cell, Position } from "./map";
import type { MoveRecord } from "./App";

const BOARD_SIZE = "min(90vw, 420px)";
const CELL_SIZE = "calc(25% - 10px)";
const MOVE_DURATION_PER_TILE = 50;

const gameMapStyle: CSSProperties = {
  width: BOARD_SIZE,
  height: BOARD_SIZE,
  boxSizing: "border-box",
  position: "relative",
};

function cellCoordinates({ x, y }: Position) {
  return {
    top: `calc(${y * 25}% + ${8 - y * 2}px)`,
    left: `calc(${x * 25}% + ${8 - x * 2}px)`,
  };
}

function movementDuration(source: Position, target: Position) {
  return (
    (Math.abs(source.x - target.x) + Math.abs(source.y - target.y)) *
    MOVE_DURATION_PER_TILE
  );
}

function backgroundCellStyle(position: Position): CSSProperties {
  return {
    position: "absolute",
    ...cellCoordinates(position),
    width: CELL_SIZE,
    height: CELL_SIZE,
  };
}

function cellStyle(
  cell: Cell,
  position: Position,
  lastMoveWasUndo: boolean,
): CSSProperties {
  let animation: string | undefined;
  if (!lastMoveWasUndo && cell?.state === "merged") {
    const mergeDuration = Math.max(
      ...cell.prevPositions.map((sourcePosition) =>
        movementDuration(sourcePosition, position),
      ),
    );
    animation = `new-cell 0.15s ease-out ${mergeDuration}ms backwards`;
  } else if (!lastMoveWasUndo && cell?.state === "new") {
    animation = "new-cell 0.15s ease-out";
  }
  
  const _style: CSSProperties = {
    position: "absolute",
    ...cellCoordinates(position),
    width: CELL_SIZE,
    height: CELL_SIZE,
    zIndex: cell ? 9999 : 0,
    animation: animation,
  };

  return _style;
}

function cellClass(cell: NonNullable<Cell>) {
  return `cell-${cell.value}`;
}

function GameCell({ cell, position, lastMoveWasUndo } :
  { cell: Cell, position: Position, lastMoveWasUndo: boolean }) {
  const previousPosition = cell?.prevPositions[0];
  const shouldAnimateMovement =
    !lastMoveWasUndo &&
    cell?.state !== "new" &&
    cell?.state !== "merged" &&
    previousPosition !== undefined &&
    (previousPosition.x !== position.x || previousPosition.y !== position.y);
  const hasMounted = useRef(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const previousPositionKey = previousPosition
    ? `${previousPosition.x}-${previousPosition.y}`
    : "";

  useLayoutEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!shouldAnimateMovement || !previousPosition || !cellRef.current) return;

    const animation = cellRef.current.animate(
      [cellCoordinates(previousPosition), cellCoordinates(position)],
      { duration: movementDuration(previousPosition, position), easing: "linear" },
    );

    return () => animation.cancel();
  }, [position.x, position.y, previousPositionKey, shouldAnimateMovement]);

  return (
    <div
      ref={cellRef}
      className={`game-cell ${cell ? cellClass(cell) : "game-cell--empty"}`}
      style={cellStyle(cell, position, lastMoveWasUndo)}
    >
      {cell?.value}
    </div>
  );
}

function MergeSourceCell({
  sourcePosition,
  targetPosition,
  value,
}: {
  sourcePosition: Position;
  targetPosition: Position;
  value: number;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const sourceCell: NonNullable<Cell> = {
    state: "normal",
    value,
    prevPositions: [],
  };

  useLayoutEffect(() => {
    if (!cellRef.current) return;

    const animation = cellRef.current.animate(
      [
        { ...cellCoordinates(sourcePosition), opacity: 1, offset: 0 },
        { ...cellCoordinates(targetPosition), opacity: 1, offset: 0.99 },
        { ...cellCoordinates(targetPosition), opacity: 0, offset: 1 },
      ],
      {
        duration: movementDuration(sourcePosition, targetPosition),
        easing: "linear",
        fill: "forwards",
      },
    );

    return () => animation.cancel();
  }, [sourcePosition, targetPosition]);

  return (
    <div
      aria-hidden="true"
      ref={cellRef}
      className={`game-cell game-cell--merge-source ${cellClass(sourceCell)}`}
      style={cellStyle(sourceCell, targetPosition, false)}
    >
      {value}
    </div>
  );
}

function GameMap({ moves, lastMoveWasUndo } :
  { moves: MoveRecord[], lastMoveWasUndo: boolean }) {
  const currentMap = moves[moves.length - 1].map2048;
  const previousMap = useRef(currentMap);
  const isNewTurn = previousMap.current !== currentMap;

  useLayoutEffect(() => {
    previousMap.current = currentMap;
  }, [currentMap]);
  
  return (
    <section id="game-map" style={gameMapStyle}>
      {Array.from({ length: 16 }, (_, index) => (
        <div
          aria-hidden="true"
          key={`background-${index}`}
          className="game-cell-background"
          style={backgroundCellStyle({ x: index % 4, y: Math.floor(index / 4) })}
        />
      ))}
      {currentMap.flatMap((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <GameCell
            key={`${rowIndex}-${cellIndex}`}
            cell={cell}
            position={{ x: cellIndex, y: rowIndex }}
            lastMoveWasUndo={lastMoveWasUndo}
          />
        )),
      )}
      {isNewTurn && !lastMoveWasUndo && currentMap.flatMap((row, rowIndex) =>
        row.flatMap((cell, cellIndex) =>
          cell?.state === "merged"
            ? cell.prevPositions.map((sourcePosition, sourceIndex) => (
                <MergeSourceCell
                  key={`merge-${rowIndex}-${cellIndex}-${sourceIndex}`}
                  sourcePosition={sourcePosition}
                  targetPosition={{ x: cellIndex, y: rowIndex }}
                  value={cell.value / 2}
                />
              ))
            : [],
        ),
      )}
    </section>
  );
}

export default GameMap;
