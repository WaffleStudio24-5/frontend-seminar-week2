import assert from "node:assert/strict";
import test from "node:test";
import { type GameState, moveGame, type TileValue } from "../src/game.ts";
import {
  parseSavedGame,
  readSavedGame,
  STORAGE_KEY,
  writeSavedGame,
} from "../src/storage.ts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("선택 A/B: 이동 후 저장하고 복원하면 판과 누적 점수가 모두 유지된다", () => {
  const storage = memoryStorage();
  const game: GameState = {
    board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    score: 12,
    status: "playing",
  };
  const moved = moveGame(game, "left", { position: 0.5, value: 0 });
  assert.equal(moved.score, 16);
  assert.equal(writeSavedGame(storage, moved), true);
  assert.deepEqual(readSavedGame(storage), moved);
  assert.notEqual(readSavedGame(storage)?.board, moved.board);
});

test("128 승리 상태를 복원한 뒤에도 더 움직이지 않는다", () => {
  const storage = memoryStorage();
  const game: GameState = {
    board: [64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    score: 100,
    status: "playing",
  };
  const won = moveGame(game, "left", { position: 0, value: 0 });
  writeSavedGame(storage, won);
  const restored = readSavedGame(storage);
  assert.ok(restored);
  assert.equal(restored.status, "won");
  assert.equal(restored.score, 228);
  assert.equal(
    moveGame(restored, "right", { position: 0, value: 0 }),
    restored,
  );
});

test("저장된 status보다 게임판을 기준으로 승패를 복원한다", () => {
  const board: TileValue[] = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  const restored = parseSavedGame(
    JSON.stringify({ version: 1, board, score: 20, status: "playing" }),
  );
  assert.equal(restored?.status, "lost");
});

test("새 게임으로 덮어쓰면 이전 점수가 남지 않는다", () => {
  const storage = memoryStorage();
  const game: GameState = {
    board: [2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    score: 200,
    status: "playing",
  };
  writeSavedGame(storage, game);
  writeSavedGame(storage, { ...game, score: 0 });
  assert.equal(readSavedGame(storage)?.score, 0);
});

test("깨진 JSON·버전·판 크기·타일·점수는 복원하지 않는다", () => {
  const base = { version: 1, board: [2, ...Array(15).fill(0)], score: 0 };
  const invalid: (string | null)[] = [
    null,
    "not json",
    "null",
    "[]",
    "7",
    "{}",
    JSON.stringify({ ...base, version: 2 }),
    JSON.stringify({ ...base, board: [2, 2] }),
    JSON.stringify({ ...base, board: Array(16).fill(0) }),
    JSON.stringify({ ...base, board: [3, ...Array(15).fill(0)] }),
    JSON.stringify({ ...base, board: ["2", ...Array(15).fill(0)] }),
    JSON.stringify({ ...base, score: -4 }),
    JSON.stringify({ ...base, score: 1.5 }),
    JSON.stringify({ ...base, score: 3 }),
    JSON.stringify({ ...base, score: "4" }),
  ];
  for (const raw of invalid)
    assert.equal(parseSavedGame(raw), null, String(raw));
});

test("저장 공간 접근이 차단되거나 가득 차도 예외를 바깥으로 던지지 않는다", () => {
  const game: GameState = {
    board: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    score: 0,
    status: "playing",
  };
  const blocked = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  assert.equal(readSavedGame(blocked), null);
  assert.equal(writeSavedGame(blocked, game), false);
  assert.equal(STORAGE_KEY, "waffle-week2-128-v1");
});
