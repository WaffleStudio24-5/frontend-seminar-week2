export type TileValue = 0 | 2 | 4 | 8 | 16 | 32 | 64 | 128;
export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "playing" | "won" | "lost";

export type GameState = {
  board: TileValue[];
  score: number;
  status: GameStatus;
};

// 두 값 모두 0 이상 1 미만인 난수다. 난수를 바깥에서 받아 계산을 순수하게 유지한다.
export type RandomValues = { position: number; value: number };

const SIZE = 4;

function addRandomTile(
  board: readonly TileValue[],
  random: RandomValues,
): TileValue[] {
  const emptyIndices = board.flatMap((value, index) =>
    value === 0 ? [index] : [],
  );
  const nextBoard = [...board];

  if (emptyIndices.length === 0) return nextBoard;

  const selectedIndex =
    emptyIndices[Math.floor(random.position * emptyIndices.length)];
  nextBoard[selectedIndex] = random.value < 0.9 ? 2 : 4;
  return nextBoard;
}

export function getStatus(board: readonly TileValue[]): GameStatus {
  if (board.includes(128)) return "won";
  if (board.includes(0)) return "playing";

  // 빈칸이 없어도 가로 또는 세로로 같은 값이 붙어 있으면 합칠 수 있다.
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const index = row * SIZE + column;
      if (column < SIZE - 1 && board[index] === board[index + 1])
        return "playing";
      if (row < SIZE - 1 && board[index] === board[index + SIZE])
        return "playing";
    }
  }

  return "lost";
}

export function createGame(
  first: RandomValues,
  second: RandomValues,
): GameState {
  const emptyBoard: TileValue[] = Array<TileValue>(SIZE * SIZE).fill(0);
  const board = addRandomTile(addRandomTile(emptyBoard, first), second);
  return { board, score: 0, status: "playing" };
}

function getLineIndices(direction: Direction, line: number): number[] {
  // 이동 방향에서 가까운 칸부터 읽으면 네 방향 모두 같은 병합 계산을 쓸 수 있다.
  return Array.from({ length: SIZE }, (_, offset) => {
    switch (direction) {
      case "left":
        return line * SIZE + offset;
      case "right":
        return line * SIZE + (SIZE - 1 - offset);
      case "up":
        return offset * SIZE + line;
      case "down":
        return (SIZE - 1 - offset) * SIZE + line;
    }
  });
}

export function moveGame(
  state: GameState,
  direction: Direction,
  random: RandomValues,
): GameState {
  if (state.status !== "playing") return state;

  const board: TileValue[] = Array<TileValue>(SIZE * SIZE).fill(0);
  let addedScore = 0;

  for (let line = 0; line < SIZE; line += 1) {
    const indices = getLineIndices(direction, line);
    const values = indices
      .map((index) => state.board[index])
      .filter((value) => value !== 0);
    const merged: TileValue[] = [];

    for (let index = 0; index < values.length; index += 1) {
      const current = values[index];
      if (index + 1 < values.length && current === values[index + 1]) {
        const combined = (current * 2) as TileValue;
        merged.push(combined);
        addedScore += combined;
        // 방금 합친 두 타일을 모두 건너뛴다. 만들어진 타일을 같은 이동에서 또 합치지 않는다.
        index += 1;
      } else {
        merged.push(current);
      }
    }

    indices.forEach((boardIndex, index) => {
      board[boardIndex] = merged[index] ?? 0;
    });
  }

  // 실제로 달라진 것이 없으면 점수와 타일을 그대로 둔다.
  if (board.every((value, index) => value === state.board[index])) return state;

  const score = state.score + addedScore;
  if (getStatus(board) === "won") return { board, score, status: "won" };

  const nextBoard = addRandomTile(board, random);
  return { board: nextBoard, score, status: getStatus(nextBoard) };
}
