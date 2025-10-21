/**
 * Finished Phase Component
 * Phase สำหรับแสดงผลสรุปเกม
 */

"use client";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  isRevealed: boolean;
  isCorrect?: boolean;
};

interface FinishedPhaseProps {
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    status: string;
    hearts: number;
    revealedNumbers: number[];
    totalRounds: number;
  };
}

export default function FinishedPhase({
  playerAnswers,
  gameState,
}: FinishedPhaseProps) {
  const finalHearts = gameState.status === "lost" ? 0 : gameState.hearts;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
      {gameState.status === "won" ? (
        <>
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h3 className="text-4xl font-bold text-green-400 mb-4">ชนะแล้ว!</h3>
          <p className="text-white/90 text-xl mb-6">
            คุณและเพื่อนๆ ผ่านเกมได้สำเร็จ
          </p>
        </>
      ) : (
        <>
          <div className="text-8xl mb-6">💔</div>
          <h3 className="text-4xl font-bold text-red-400 mb-4">แพ้แล้ว</h3>
          <p className="text-white/90 text-xl mb-6">
            หัวใจหมดแล้ว ลองใหม่อีกครั้งนะ!
          </p>
        </>
      )}

      {/* Summary Box */}
      <div className="bg-white/5 rounded-2xl p-8 mb-8 max-w-md mx-auto">
        <h4 className="text-2xl font-bold text-white mb-6">สรุปผล</h4>

        {/* Hearts */}
        <div className="mb-6">
          <div className="text-white/70 mb-2">หัวใจคงเหลือ:</div>
          <div className="flex justify-center gap-2 mb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`text-5xl ${
                  i < finalHearts
                    ? "text-red-500"
                    : "text-gray-600 opacity-30"
                }`}
              >
                ❤️
              </div>
            ))}
          </div>
          <div className="text-3xl font-bold text-yellow-300">
            {finalHearts} / 3
          </div>
        </div>

        {/* Rounds */}
        <div className="mb-6">
          <div className="text-white/70 mb-2">เลขที่เปิดแล้ว:</div>
          <div className="text-2xl font-bold text-white">
            {gameState.revealedNumbers.length} / {gameState.totalRounds}
          </div>
        </div>

        {/* Result */}
        <div className="pt-6 border-t border-white/20">
          <div className="text-3xl font-bold">
            {gameState.status === "won" ? (
              <span className="text-green-400">✅ ชนะ</span>
            ) : (
              <span className="text-red-400">❌ แพ้</span>
            )}
          </div>
        </div>
      </div>

      {/* Show all numbers (revealed + unrevealed) */}
      <div className="mt-8 max-w-2xl mx-auto">
        <h4 className="text-xl font-bold text-white mb-4">ตัวเลขทั้งหมด:</h4>
        <div className="space-y-3">
          {/* เลขที่เปิดแล้ว */}
          {playerAnswers
            .filter((a) => a.isRevealed)
            .sort((a, b) => a.number - b.number)
            .map((ans, i) => (
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
                    <div className="text-white/50 text-sm">
                      {ans.playerName}
                    </div>
                  </div>
                </div>
                {ans.isCorrect === true && (
                  <div className="text-green-400 text-2xl">✓</div>
                )}
                {ans.isCorrect === false && (
                  <div className="text-red-400 text-2xl">✗</div>
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
                <div className="text-gray-500 text-sm">ไม่ได้เปิด</div>
              </div>
            ))}
        </div>
      </div>

      {/* ปุ่มกลับหน้าหลัก */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
