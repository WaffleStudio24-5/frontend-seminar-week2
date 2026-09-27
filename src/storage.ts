import { getStatus, type GameState, type TileValue } from "./game.ts";

export const STORAGE_KEY = "waffle-week2-128-v1";

const allowedTiles = new Set([0, 2, 4, 8, 16, 32, 64, 128]);

// 저장된 문자열을 검사합니다. 손상되거나 다른 버전인 데이터는 사용하지 않습니다.
export function parseSavedGame(raw: string | null): GameState | null {
  if (raw === null) return null;

  try {
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null) return null;
    if (!("version" in saved) || saved.version !== 1) return null;
    if (!("board" in saved) || !Array.isArray(saved.board)) return null;
    if (saved.board.length !== 16) return null;
    if (
      !saved.board.every(
        (tile: unknown) => typeof tile === "number" && allowedTiles.has(tile),
      )
    ) {
      return null;
    }
    if (saved.board.every((tile) => tile === 0)) return null;
    if (!("score" in saved) || typeof saved.score !== "number") return null;
    if (
      !Number.isSafeInteger(saved.score) ||
      saved.score < 0 ||
      saved.score % 4 !== 0
    ) {
      return null;
    }

    const board = saved.board.slice() as TileValue[];
    // 종료 여부는 저장된 글자를 믿지 않고 실제 게임판에서 다시 판정합니다.
    return { board, score: saved.score, status: getStatus(board) };
  } catch {
    return null;
  }
}

export function readSavedGame(
  storage: Pick<Storage, "getItem">,
): GameState | null {
  try {
    return parseSavedGame(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeSavedGame(
  storage: Pick<Storage, "setItem">,
  game: GameState,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...game }));
    return true;
  } catch {
    return false;
  }
}
