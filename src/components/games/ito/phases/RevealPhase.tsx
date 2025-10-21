/**
 * Reveal Phase Component
 * Phase สำหรับแสดงผลการโหวต
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

interface RevealPhaseProps {
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    revealedNumbers: number[];
    status: string;
  };
  lastRevealResult: {
    isCorrect: boolean;
    heartsLost: number;
    newHearts: number;
  } | null;
}

export default function RevealPhase({
  playerAnswers,
  gameState,
  lastRevealResult,
}: RevealPhaseProps) {
  // Find the last revealed player answer
  const lastRevealedNumber =
    gameState.revealedNumbers[gameState.revealedNumbers.length - 1];
  const votedAnswer = playerAnswers.find(
    (a) => a.isRevealed && a.number === lastRevealedNumber
  );

  if (!votedAnswer) {
    console.warn("⚠️ No voted answer found for reveal phase");
    return null;
  }

  const isCorrect = lastRevealResult?.isCorrect;
  const heartsLost = lastRevealResult?.heartsLost ?? 0;

  // หาเลขทั้งหมดที่เปิดในรอบนี้
  const revealedThisRound = playerAnswers
    .filter((a) => a.isRevealed && a.number <= lastRevealedNumber)
    .map((a) => a.number)
    .filter((num, index, self) => self.indexOf(num) === index) // unique
    .sort((a, b) => a - b);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">
        ผลการโหวต
      </h3>

      {/* Revealed Card */}
      <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl p-8 mb-6 border-2 border-purple-400">
        <div className="text-center mb-4">
          <div className="text-white/70 mb-2">
            คำใบ้ที่ได้รับโหวตมากสุด:
          </div>
          <div className="text-white text-2xl font-bold mb-2">
            {votedAnswer.playerName}
          </div>
          <div className="text-white/90 text-xl italic mb-4">
            &quot;{votedAnswer.answer}&quot;
          </div>
        </div>

        {/* Number Reveal */}
        <div className="bg-white/20 rounded-xl p-6 mb-4">
          <div className="text-center">
            <div className="text-white/70 mb-2">
              {revealedThisRound.length > 1
                ? "เปิดเลขทั้งหมด:"
                : "หมายเลข:"}
            </div>
            {revealedThisRound.length > 1 ? (
              <div className="flex flex-wrap justify-center gap-3">
                {revealedThisRound.map((num, i) => (
                  <div
                    key={i}
                    className={`text-5xl font-bold ${
                      num === votedAnswer.number
                        ? "text-yellow-300"
                        : "text-yellow-300/60"
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-6xl font-bold text-yellow-300">
                {votedAnswer.number}
              </div>
            )}
            {revealedThisRound.length > 1 && (
              <div className="text-white/50 text-sm mt-2">
                (เปิดเลขสุดท้ายอัตโนมัติ)
              </div>
            )}
          </div>
        </div>

        {/* Correct/Incorrect */}
        {isCorrect !== undefined && (
          <>
            {isCorrect ? (
              <div className="text-center">
                <div className="text-6xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-400">
                  ถูกต้อง!
                </div>
                <div className="text-white/70 mt-2">
                  นี่คือตัวเลขที่น้อยที่สุด
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">❌</div>
                <div className="text-2xl font-bold text-red-400">ผิด!</div>
                <div className="text-white/70 mt-2">
                  ข้ามตัวเลขไป - เสียหัวใจ {heartsLost} ดวง
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Revealed Numbers Progress */}
      <div className="bg-white/5 rounded-xl p-6">
        <h4 className="text-white font-bold mb-3 text-center">
          ตัวเลขที่เปิดแล้ว:
        </h4>
        <div className="flex flex-wrap justify-center gap-2">
          {gameState.revealedNumbers.map((num, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded-lg text-xl font-bold ${
                i === gameState.revealedNumbers.length - 1
                  ? "bg-yellow-500/50 text-yellow-100 border-2 border-yellow-400"
                  : "bg-white/20 text-white"
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-transition message */}
      <div className="text-center mt-6 text-white/70">
        {gameState.status === "won" || gameState.status === "lost" ? (
          <p>กำลังสรุปผล...</p>
        ) : (
          <p>กำลังเตรียมรอบต่อไป...</p>
        )}
      </div>
    </div>
  );
}
