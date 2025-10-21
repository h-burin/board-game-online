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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-12 border border-white/20 text-center">
      {gameState.status === "won" ? (
        <>
          <div className="text-6xl md:text-8xl mb-4 md:mb-6 animate-bounce">🎉</div>
          <h3 className="text-2xl md:text-4xl font-bold text-green-400 mb-3 md:mb-4">ชนะแล้ว!</h3>
          <p className="text-white/90 text-base md:text-xl mb-4 md:mb-6">
            คุณและเพื่อนๆ ผ่านเกมได้สำเร็จ
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl md:text-8xl mb-4 md:mb-6">💔</div>
          <h3 className="text-2xl md:text-4xl font-bold text-red-400 mb-3 md:mb-4">แพ้แล้ว</h3>
          <p className="text-white/90 text-base md:text-xl mb-4 md:mb-6">
            หัวใจหมดแล้ว ลองใหม่อีกครั้งนะ!
          </p>
        </>
      )}

      {/* Summary Box */}
      <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 max-w-md mx-auto">
        <h4 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">สรุปผล</h4>

        {/* Hearts */}
        <div className="mb-4 md:mb-6">
          <div className="text-white/70 mb-2 text-sm md:text-base">หัวใจคงเหลือ:</div>
          <div className="flex justify-center gap-1.5 md:gap-2 mb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`text-4xl md:text-5xl ${
                  i < finalHearts
                    ? "text-red-500"
                    : "text-gray-600 opacity-30"
                }`}
              >
                ❤️
              </div>
            ))}
          </div>
          <div className="text-2xl md:text-3xl font-bold text-yellow-300">
            {finalHearts} / 3
          </div>
        </div>

        {/* Rounds */}
        <div className="mb-4 md:mb-6">
          <div className="text-white/70 mb-2 text-sm md:text-base">เลขที่เปิดแล้ว:</div>
          <div className="text-xl md:text-2xl font-bold text-white">
            {gameState.revealedNumbers.length} / {gameState.totalRounds}
          </div>
        </div>

        {/* Result */}
        <div className="pt-4 md:pt-6 border-t border-white/20">
          <div className="text-2xl md:text-3xl font-bold">
            {gameState.status === "won" ? (
              <span className="text-green-400">✅ ชนะ</span>
            ) : (
              <span className="text-red-400">❌ แพ้</span>
            )}
          </div>
        </div>
      </div>

      {/* Show all numbers (revealed + unrevealed) */}
      <div className="mt-6 md:mt-8 max-w-6xl mx-auto">
        <h4 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 text-center">ตัวเลขทั้งหมด:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {/* เลขที่เปิดแล้ว */}
          {playerAnswers
            .filter((a) => a.isRevealed)
            .sort((a, b) => a.number - b.number)
            .map((ans, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-lg md:rounded-xl p-2.5 md:p-4 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <div className="text-xl md:text-3xl font-bold text-yellow-300 min-w-[50px] md:min-w-[60px] flex-shrink-0">
                    [{ans.number}]
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-white text-sm md:text-lg truncate">
                      &quot;{ans.answer}&quot;
                    </div>
                    <div className="text-white/50 text-xs md:text-sm">
                      {ans.playerName}
                    </div>
                  </div>
                </div>
                {ans.isCorrect === true && (
                  <div className="text-green-400 text-lg md:text-2xl flex-shrink-0">✓</div>
                )}
                {ans.isCorrect === false && (
                  <div className="text-red-400 text-lg md:text-2xl flex-shrink-0">✗</div>
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
                className="bg-white/5 rounded-lg md:rounded-xl p-2.5 md:p-4 flex items-center justify-between border border-white/10 gap-2"
              >
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <div className="text-xl md:text-3xl font-bold text-gray-400 min-w-[50px] md:min-w-[60px] flex-shrink-0">
                    [{ans.number}]
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-gray-400 text-sm md:text-lg truncate">
                      &quot;{ans.answer}&quot;
                    </div>
                    <div className="text-gray-500 text-xs md:text-sm">{ans.playerName}</div>
                  </div>
                </div>
                <div className="text-gray-500 text-xs md:text-sm flex-shrink-0">ไม่ได้เปิด</div>
              </div>
            ))}
        </div>
      </div>

      {/* ปุ่มกลับหน้าหลัก */}
      <div className="mt-6 md:mt-8 flex justify-center gap-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-base md:text-lg font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl transition-all transform hover:scale-105"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
