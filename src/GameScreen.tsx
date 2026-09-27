import type { Direction, GameStatus, TileValue } from "./game";
import "./Game.css";

type GameScreenProps = {
  board: readonly TileValue[];
  score: number;
  status: GameStatus;
  onRestart: () => void;
  onMove: (direction: Direction) => void;
  storageAvailable: boolean;
};

const cells = Array.from({ length: 16 }, (_, index) => ({
  id: `cell-${Math.floor(index / 4)}-${index % 4}`,
  index,
}));

const controls: { direction: Direction; label: string; arrow: string }[] = [
  { direction: "up", label: "위로 이동", arrow: "↑" },
  { direction: "left", label: "왼쪽으로 이동", arrow: "←" },
  { direction: "down", label: "아래로 이동", arrow: "↓" },
  { direction: "right", label: "오른쪽으로 이동", arrow: "→" },
];

const statusLabels: Record<GameStatus, string> = {
  playing: "게임 진행 중",
  won: "128 완성! 게임 성공",
  lost: "더 움직일 수 없어요. 게임 종료",
};

/** 게임 상태를 화면으로 보여 주고 사용자 입력을 부모 컴포넌트에 전달합니다. */
export default function GameScreen({
  board,
  score,
  status,
  onRestart,
  onMove,
  storageAvailable,
}: GameScreenProps) {
  return (
    <div className="game-page">
      <div className="game-container">
        <main className="game-layout">
          <h1 className="game-title">128</h1>
          <section className="game-panel" aria-label="숫자 합치기 게임">
            <div className="game-toolbar">
              <div className="game-stats">
                <div className="game-stat">
                  <span className="game-stat-label">점수</span>
                  <span className="game-stat-value" data-testid="score">
                    {score.toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="game-stat game-stat--target">
                  <span className="game-stat-label">목표</span>
                  <span className="game-stat-value">128 만들기</span>
                </div>
              </div>
              <div className="game-actions">
                <button
                  className="game-button"
                  type="button"
                  onClick={onRestart}
                >
                  새 게임
                </button>
              </div>
            </div>

            <p
              className="game-visually-hidden"
              role="status"
              data-testid="game-status"
              data-status={status}
            >
              {statusLabels[status]}
            </p>
            <div className="game-board-shell">
              <div
                className="game-board"
                data-testid="game-board"
                role="group"
                aria-label="4행 4열 게임판"
                aria-describedby="game-keyboard-hint"
                tabIndex={0}
              >
                {cells.map((cell) => {
                  const value = board[cell.index] ?? 0;
                  return (
                    <div
                      className="game-cell"
                      role="img"
                      data-value={value}
                      key={cell.id}
                      aria-label={`${Math.floor(cell.index / 4) + 1}행 ${(cell.index % 4) + 1}열: ${value || "빈칸"}`}
                    >
                      {value === 0 ? "" : value}
                    </div>
                  );
                })}
              </div>
              {status !== "playing" && (
                <section
                  className="game-outcome"
                  aria-labelledby="game-outcome-title"
                >
                  <div className="game-outcome-card">
                    <h2 id="game-outcome-title" className="game-outcome-title">
                      {status === "won"
                        ? "128, 해냈어요!"
                        : "더 움직일 수 없어요"}
                    </h2>
                    <p className="game-outcome-score">
                      최종 점수{" "}
                      <strong>{score.toLocaleString("ko-KR")}점</strong>
                    </p>
                    <button
                      className="game-button game-button--primary"
                      type="button"
                      onClick={onRestart}
                    >
                      다시 시작하기
                    </button>
                  </div>
                </section>
              )}
            </div>

            <p id="game-keyboard-hint" className="game-keyboard-hint">
              방향키 또는 아래 버튼으로 숫자를 합쳐 128을 만드세요.
            </p>
            <div className="game-pad" role="group" aria-label="방향 조작">
              {controls.map(({ direction, label, arrow }) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={label}
                  disabled={status !== "playing"}
                  onClick={() => onMove(direction)}
                >
                  {arrow}
                </button>
              ))}
            </div>
            {!storageAvailable && (
              <p className="game-save-status" role="status">
                저장할 수 없어 새로고침하면 게임이 초기화됩니다.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
