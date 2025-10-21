/**
 * Level Complete Phase Component
 * Phase สำหรับจบ Level และเตรียมไป Level ถัดไป
 */

"use client";

import { markPlayerReady } from "@/lib/firebase/ito";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  isRevealed: boolean;
  isCorrect?: boolean;
};

type ReadyPlayer = {
  playerId: string;
  playerName: string;
};

interface LevelCompletePhaseProps {
  sessionId: string;
  playerId: string;
  playerAnswers: ItoPlayerAnswer[];
  readyPlayers: ReadyPlayer[];
  readyCount: number;
  gameState: {
    currentLevel: number;
    totalLevels: number;
    hearts: number;
  };
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

export default function LevelCompletePhase({
  sessionId,
  playerId,
  playerAnswers,
  readyPlayers,
  readyCount,
  gameState,
  submitting,
  setSubmitting,
}: LevelCompletePhaseProps) {
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;

  // สร้าง map ของ playerId → playerName
  const playerNames: { [key: string]: string } = {};
  playerAnswers.forEach((a) => {
    if (!playerNames[a.playerId]) {
      playerNames[a.playerId] = a.playerName;
    }
  });

  // หาว่าใครพร้อมแล้ว
  const readyPlayerIds = readyPlayers.map((r) => r.playerId);
  const notReadyPlayers = uniquePlayerIds.filter(
    (id) => !readyPlayerIds.includes(id)
  );

  // เรียงเลขที่เปิดแล้ว + ดึงคำใบ้
  const revealedAnswers = playerAnswers
    .filter((a) => a.isRevealed)
    .sort((a, b) => a.number - b.number);

  // เช็คว่า player ปัจจุบันพร้อมหรือยัง
  const isPlayerReady = readyPlayerIds.includes(playerId);

  const handleReady = async () => {
    if (submitting || isPlayerReady) return;

    setSubmitting(true);
    const playerName = playerNames[playerId] || "Unknown";
    const success = await markPlayerReady(sessionId, playerId, playerName);

    if (success) {
      console.log("✅ Marked as ready");
    } else {
      alert("เกิดข้อผิดพลาดในการยืนยัน");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20">
      <div className="text-center mb-8">
        <div className="text-8xl mb-6">🎊</div>
        <h3 className="text-4xl font-bold text-blue-400 mb-4">
          ผ่านรอบที่ {gameState.currentLevel}!
        </h3>
        <p className="text-white/90 text-xl">
          {gameState.currentLevel >= gameState.totalLevels
            ? "เยี่ยมมาก! เตรียมพร้อมดูผลลัพธ์"
            : "เยี่ยมมาก! เตรียมพร้อมสำหรับรอบถัดไป"}
        </p>
      </div>

      {/* เลขทั้งหมด (เปิดแล้ว + ยังไม่เปิด) */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-6 mb-6 border border-green-400/30">
        <h4 className="text-white font-bold mb-4 text-center text-xl">
          ตัวเลขทั้งหมดในรอบนี้
        </h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* เลขที่เปิดแล้ว */}
          {revealedAnswers.map((ans, i) => (
            <div
              key={i}
              className="bg-white/10 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-yellow-300 min-w-[60px]">
                  [{ans.number}]
                </div>
                <div className="text-left">
                  <div className="text-white text-lg">
                    &quot;{ans.answer}&quot;
                  </div>
                  <div className="text-white/50 text-sm">{ans.playerName}</div>
                </div>
              </div>
              {ans.isCorrect === true && (
                <div className="text-green-400 text-xl">✓</div>
              )}
              {ans.isCorrect === false && (
                <div className="text-red-400 text-xl">✗</div>
              )}
            </div>
          ))}

          {/* เลขที่ยังไม่ได้เปิด */}
          {playerAnswers
            .filter((a) => !a.isRevealed)
            .sort((a, b) => a.number - b.number)
            .map((ans, i) => (
              <div
                key={`unrevealed-${i}`}
                className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-gray-400 min-w-[60px]">
                    [{ans.number}]
                  </div>
                  <div className="text-left">
                    <div className="text-gray-400 text-lg">
                      &quot;{ans.answer}&quot;
                    </div>
                    <div className="text-gray-500 text-sm">{ans.playerName}</div>
                  </div>
                </div>
                <div className="text-gray-500 text-sm">ยังไม่เปิด</div>
              </div>
            ))}
        </div>
      </div>

      {/* Progress & Hearts */}
      <div className="bg-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white/70 text-sm">ความคืบหน้า:</div>
            <div className="text-2xl font-bold text-yellow-300">
              รอบ {gameState.currentLevel} / {gameState.totalLevels}
            </div>
          </div>
          <div>
            <div className="text-white/70 text-sm text-center mb-1">
              หัวใจคงเหลือ
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`text-3xl ${
                    i < gameState.hearts
                      ? "text-red-500"
                      : "text-gray-600 opacity-30"
                  }`}
                >
                  ❤️
                </div>
              ))}
            </div>
            <div className="text-xl font-bold text-white text-center">
              {gameState.hearts} / 3
            </div>
          </div>
        </div>

        {gameState.currentLevel < gameState.totalLevels && (
          <div className="pt-4 border-t border-white/20 text-center">
            <div className="text-white/90 font-semibold">
              รอบถัดไป: คนละ {gameState.currentLevel + 1} เลข
            </div>
          </div>
        )}
      </div>

      {/* สถานะผู้เล่น */}
      <div className="bg-white/5 rounded-2xl p-6 mb-6">
        <h4 className="text-white font-bold mb-3 text-center">
          สถานะผู้เล่น
        </h4>
        <div className="text-center text-white/70 mb-4">
          {readyCount} / {totalPlayers} คนพร้อมแล้ว
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* พร้อมแล้ว */}
          <div>
            <div className="text-green-400 text-sm mb-2 text-center">
              ✅ พร้อมแล้ว
            </div>
            <div className="space-y-1">
              {readyPlayers.map((r) => (
                <div
                  key={r.playerId}
                  className="text-white/80 text-sm text-center bg-green-500/20 rounded py-1"
                >
                  {r.playerName}
                </div>
              ))}
            </div>
          </div>

          {/* รออยู่ */}
          <div>
            <div className="text-orange-400 text-sm mb-2 text-center">
              ⏳ รออยู่
            </div>
            <div className="space-y-1">
              {notReadyPlayers.map((id) => (
                <div
                  key={id}
                  className="text-white/50 text-sm text-center bg-orange-500/20 rounded py-1"
                >
                  {playerNames[id]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ปุ่ม */}
      {!isPlayerReady ? (
        <button
          onClick={handleReady}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105"
        >
          {submitting
            ? "กำลังบันทึก..."
            : gameState.currentLevel >= gameState.totalLevels
            ? "พร้อมดูผลลัพธ์"
            : "พร้อมไปรอบถัดไป"}
        </button>
      ) : (
        <div className="text-center py-4">
          <div className="text-green-400 text-2xl font-bold mb-2">
            ✓ คุณพร้อมแล้ว
          </div>
          <div className="text-white/70">รอผู้เล่นคนอื่น...</div>
        </div>
      )}
    </div>
  );
}
