/**
 * Game Header Component
 * แสดงโจทย์, หัวใจ, และตัวนับเวลา
 */

"use client";

interface GameHeaderProps {
  questionText: string;
  revealedCount: number;
  totalRounds: number;
  hearts: number;
  phase: string;
  status: string;
  lastRevealResult?: {
    number: number;
    isCorrect: boolean;
    heartsLost: number;
    newHearts: number;
  } | null;
  timeLeft?: number;
  phaseEndTime?: Date | null;
}

export default function GameHeader({
  questionText,
  revealedCount,
  totalRounds,
  hearts,
  phase,
  status,
  lastRevealResult,
  timeLeft,
  phaseEndTime,
}: GameHeaderProps) {
  // คำนวณหัวใจที่แสดง
  let currentHearts = hearts;
  if (phase === "reveal" && lastRevealResult) {
    currentHearts = lastRevealResult.newHearts;
  } else if (phase === "finished" && status === "lost") {
    currentHearts = 0;
  }

  const minutes = timeLeft ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft ? timeLeft % 60 : 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/20 mt-4 md:mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6">
        <div className="mb-4 md:mb-0 w-full md:w-auto text-center md:text-left">
          <h3 className="text-sm md:text-lg text-white/70 mb-1 md:mb-2">โจทย์:</h3>
          <p className="text-lg md:text-3xl font-bold text-white mb-1 md:mb-2">
            {questionText}
          </p>
          <p className="text-sm md:text-base text-blue-200">
            เปิดแล้ว {revealedCount}/{totalRounds} เลข
          </p>
        </div>

        {/* Hearts */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 md:gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`text-3xl md:text-4xl transition-all duration-500 ${
                  i < currentHearts
                    ? "text-red-500 scale-100"
                    : "text-gray-600 opacity-30 scale-75"
                }`}
              >
                ❤️
              </div>
            ))}
          </div>
          <div className="text-center text-white/70 text-xs md:text-sm mt-1">
            {currentHearts} / 3
          </div>
        </div>
      </div>

      {/* Timer */}
      {phase !== "finished" && phaseEndTime && timeLeft !== undefined && (
        <div className="mb-4 md:mb-6 text-center">
          <div className="text-4xl md:text-6xl font-bold text-yellow-300">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
          <div className="text-xs md:text-sm text-white/70 mt-1">เวลาเล่น</div>
        </div>
      )}
    </div>
  );
}
