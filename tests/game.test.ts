import assert from "node:assert/strict";
import test from "node:test";
import {
  createGame,
  getStatus,
  moveGame,
  type GameState,
  type TileValue,
} from "../src/game.ts";

const firstEmptyTwo = { position: 0, value: 0 };
const lastEmptyTwo = { position: 0.999999, value: 0 };

function game(board: TileValue[], score = 0): GameState {
  assert.equal(board.length, 16);
  return { board, score, status: getStatus(board) };
}

test("시작할 때 서로 다른 두 칸에만 타일을 만든다", () => {
  const state = createGame(firstEmptyTwo, firstEmptyTwo);
  assert.deepEqual(
    state.board,
    [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
  assert.equal(state.score, 0);
  assert.equal(state.status, "playing");
});

test("난수 0.9를 경계로 2와 4를 생성하고 마지막 빈칸도 선택할 수 있다", () => {
  const state = createGame(
    { position: 0, value: 0.899999 },
    { position: 0.999999, value: 0.9 },
  );
  assert.equal(state.board[0], 2);
  assert.equal(state.board[15], 4);
  assert.equal(state.board.filter((value) => value !== 0).length, 2);
});

test("왼쪽 이동: 빈칸을 없애고 합친 뒤 새 타일 하나를 만든다", () => {
  const before = game([0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const after = moveGame(before, "left", lastEmptyTwo);
  assert.deepEqual(
    after.board,
    [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  );
  assert.equal(after.score, 4);
});

test("오른쪽 이동은 오른쪽부터 병합 순서를 결정한다", () => {
  const before = game([2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const after = moveGame(before, "right", lastEmptyTwo);
  assert.deepEqual(
    after.board,
    [0, 0, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  );
  assert.equal(after.score, 4);
});

test("위쪽 이동은 열 단위로 타일을 합친다", () => {
  const before = game([0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0]);
  const after = moveGame(before, "up", lastEmptyTwo);
  assert.deepEqual(
    after.board,
    [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  );
  assert.equal(after.score, 4);
});

test("아래쪽 이동은 아래부터 병합 순서를 결정한다", () => {
  const before = game([0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0]);
  const after = moveGame(before, "down", firstEmptyTwo);
  assert.deepEqual(
    after.board,
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0],
  );
  assert.equal(after.score, 4);
});

test("2, 2, 4는 한 번의 이동에서 8로 연속 병합되지 않는다", () => {
  const before = game([2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const after = moveGame(before, "left", lastEmptyTwo);
  assert.deepEqual(after.board.slice(0, 4), [4, 4, 0, 0]);
  assert.equal(after.score, 4);
});

test("네 개의 같은 타일은 두 쌍으로만 합치며 여러 줄의 점수를 누적한다", () => {
  const before = game([2, 2, 2, 2, 4, 4, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0], 20);
  const after = moveGame(before, "left", lastEmptyTwo);
  assert.deepEqual(after.board.slice(0, 8), [4, 4, 0, 0, 8, 16, 0, 0]);
  assert.equal(after.score, 52);
});

test("병합 없이 이동만 해도 새 타일을 만들지만 점수는 올리지 않는다", () => {
  const before = game([0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 12);
  const after = moveGame(before, "left", { position: 0, value: 0.95 });
  assert.deepEqual(after.board.slice(0, 4), [8, 4, 0, 0]);
  assert.equal(after.score, 12);
});

test("움직일 수 없는 방향은 원래 상태를 그대로 반환하고 타일을 추가하지 않는다", () => {
  const before = game([2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 8);
  const after = moveGame(before, "left", firstEmptyTwo);
  assert.strictEqual(after, before);
});

test("128을 만들면 즉시 승리하고 새 타일은 추가하지 않는다", () => {
  const before = game([64, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 100);
  const after = moveGame(before, "left", firstEmptyTwo);
  assert.equal(after.status, "won");
  assert.equal(after.score, 228);
  assert.deepEqual(
    after.board,
    [128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
  assert.strictEqual(moveGame(after, "right", firstEmptyTwo), after);
});

test("빈칸도 병합 가능한 이웃도 없으면 패배하고 이후 입력을 무시한다", () => {
  const before = game([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]);
  assert.equal(before.status, "lost");
  assert.strictEqual(moveGame(before, "left", firstEmptyTwo), before);
});

test("마지막 빈칸에 새 타일이 생겨 이동 불가능해진 순간 패배한다", () => {
  const before = game([2, 0, 4, 2, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]);
  const after = moveGame(before, "left", { position: 0, value: 0.9 });
  assert.deepEqual(
    after.board,
    [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2],
  );
  assert.equal(after.status, "lost");
});

test("꽉 찬 보드라도 가로 또는 세로 병합이 가능하면 게임을 계속한다", () => {
  const horizontal: TileValue[] = [
    2, 2, 8, 16, 4, 8, 16, 32, 8, 16, 32, 64, 16, 32, 64, 2,
  ];
  const vertical: TileValue[] = [
    2, 4, 8, 16, 2, 8, 16, 32, 8, 16, 32, 64, 16, 32, 64, 2,
  ];
  assert.equal(getStatus(horizontal), "playing");
  assert.equal(getStatus(vertical), "playing");
});

test("한 행의 끝과 다음 행의 시작은 가로 이웃으로 취급하지 않는다", () => {
  const board: TileValue[] = [
    2, 4, 8, 16, 16, 8, 4, 2, 2, 4, 8, 16, 16, 8, 4, 2,
  ];
  assert.equal(getStatus(board), "lost");
});

test("승리 타일 검사가 패배 검사보다 우선한다", () => {
  const board: TileValue[] = [128, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  assert.equal(getStatus(board), "won");
});

test("기존 상태를 수정하지 않고 같은 입력에 항상 같은 결과를 반환한다", () => {
  const before = game([2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 16);
  const snapshot = structuredClone(before);
  Object.freeze(before.board);
  Object.freeze(before);
  const first = moveGame(before, "left", lastEmptyTwo);
  const second = moveGame(before, "left", lastEmptyTwo);
  assert.deepEqual(before, snapshot);
  assert.deepEqual(first, second);
  assert.notStrictEqual(first, before);
});
