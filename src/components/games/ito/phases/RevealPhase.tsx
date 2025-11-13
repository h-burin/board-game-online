/**
 * Reveal Phase Component (Mobile-First Redesign)
 * Optimized for single-screen view without scrolling
 */

"use client";

import { useEffect, useState } from "react";

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
    number: number;
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
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lastRevealResult) return null;

  const votedNumber = lastRevealResult.number;
  const votedAnswer = playerAnswers.find((a) => a.number === votedNumber);
  if (!votedAnswer) return null;

  const isCorrect = lastRevealResult.isCorrect;
  const heartsLost = lastRevealResult.heartsLost;

  // หาเลขที่เปิดในรอบนี้
  const revealedThisRound = playerAnswers
    .filter((a) => a.isRevealed && a.number <= votedNumber)
    .map((a) => a.number)
    .filter((num, index, self) => self.indexOf(num) === index)
    .sort((a, b) => a - b);

  const skippedNumbers = !isCorrect
    ? revealedThisRound.filter((num) => num < votedNumber)
    : [];

  const isAutoRevealed = revealedThisRound.length > 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />

      {/* Modal - Mobile Optimized */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">

          {/* Main Content - Compact Layout */}
          <div className="p-5 space-y-3">

            {/* Header: Result Status */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'ถูกต้อง!' : 'ผิด!'}
              </div>
            </div>

            {/* Voted Number Card - Compact */}
            <div className={`
              rounded-xl p-4 border-2
              ${isCorrect
                ? 'bg-green-500/20 border-green-400/50'
                : 'bg-red-500/20 border-red-400/50'
              }
            `}>
              {/* Number + Hint in single row */}
              <div className="flex items-center gap-4">
                {/* Number */}
                <div className={`
                  text-5xl font-bold flex-shrink-0
                  ${isCorrect ? 'text-green-300' : 'text-red-300'}
                `}>
                  {votedAnswer.number}
                </div>

                {/* Hint */}
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs mb-0.5">
                    {votedAnswer.playerName}
                  </div>
                  <div className="text-white text-sm italic truncate">
                    &quot;{votedAnswer.answer}&quot;
                  </div>
                </div>
              </div>

              {/* Skipped Numbers (if wrong) */}
              {skippedNumbers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-red-300 text-xs">ข้ามไป:</span>
                    <div className="flex gap-2">
                      {skippedNumbers.map((num) => (
                        <span key={num} className="text-red-300 text-lg font-bold">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-red-300/80 text-xs text-right mt-1">
                    -❤️ {heartsLost} ดวง
                  </div>
                </div>
              )}

              {/* Auto-reveal indicator */}
              {isAutoRevealed && (
                <div className="text-white/40 text-xs text-center mt-2 pt-2 border-t border-white/10">
                  ⚡ เปิดเลขสุดท้ายอัตโนมัติ
                </div>
              )}
            </div>

            {/* Progress: Revealed Numbers - Minimal */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs">เปิดแล้ว:</span>
                <span className="text-white/90 text-sm font-bold">
                  {gameState.revealedNumbers.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.revealedNumbers.map((num, i) => (
                  <div
                    key={i}
                    className={`
                      px-2.5 py-1 rounded text-sm font-bold
                      ${i === gameState.revealedNumbers.length - 1
                        ? 'bg-yellow-500/50 text-yellow-100 border border-yellow-400'
                        : 'bg-white/10 text-white/70'
                      }
                    `}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Countdown - Compact */}
            <div className="text-center pt-2">
              <div className="text-3xl font-bold text-yellow-300 mb-1">
                {countdown}
              </div>
              <div className="text-white/50 text-xs">
                {gameState.status === "won" || gameState.status === "lost"
                  ? "กำลังสรุปผล..."
                  : "เตรียมรอบต่อไป..."
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
