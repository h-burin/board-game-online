/**
 * Reveal Phase Component
 * Phase สำหรับแสดงผลการโหวต
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
    number: number; // เลขที่โหวต
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
  const [countdown, setCountdown] = useState(5);

  // Countdown timer (5 วินาที)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!lastRevealResult) {
    return null;
  }

  // ใช้เลขที่โหวตจริงๆ จาก API (ไม่ใช่ lastRevealedNumber)
  const votedNumber = lastRevealResult.number;
  const votedAnswer = playerAnswers.find(
    (a) => a.number === votedNumber
  );

  if (!votedAnswer) {
    return null;
  }

  const isCorrect = lastRevealResult.isCorrect;
  const heartsLost = lastRevealResult.heartsLost;

  // หาเลขทั้งหมดที่เปิดในรอบนี้ (เลขที่ <= เลขที่โหวต)
  const revealedThisRound = playerAnswers
    .filter((a) => a.isRevealed && a.number <= votedNumber)
    .map((a) => a.number)
    .filter((num, index, self) => self.indexOf(num) === index) // unique
    .sort((a, b) => a - b);

  // หาเลขที่น้อยกว่าที่ถูกข้าม (เฉพาะเมื่อผิด)
  const skippedNumbers = isCorrect === false
    ? revealedThisRound.filter((num) => num < votedNumber)
    : [];

  return (
    <>
      {/* Backdrop Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn" />

      {/* Popup Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center">
            ผลการโหวต
          </h3>

      {/* Revealed Card */}
      <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl md:rounded-2xl p-4 md:p-8 mb-4 md:mb-6 border-2 border-purple-400">
        {/* เลขที่ทีมโหวต - แสดงเด่นที่สุด */}
        <div className="bg-white/30 rounded-xl md:rounded-2xl p-2 md:p-4 mb-3 md:mb-4 border-2 border-yellow-400">
          <div className="text-center">
            <div className="text-white/90 text-base md:text-lg mb-2 md:mb-3 font-semibold">
              🎯 ทีมโหวตเลข:
            </div>
            <div className="text-5xl md:text-6xl font-bold text-yellow-300 mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
              {votedAnswer.number}
            </div>
            <div className="text-white/70 text-xs md:text-sm mb-1">
              คำใบ้ของ {votedAnswer.playerName}:
            </div>
            <div className="text-white text-base md:text-lg italic">
              &quot;{votedAnswer.answer}&quot;
            </div>
          </div>
        </div>

        {/* แสดงเลขที่ข้ามไป (ถ้ามี) */}
        {skippedNumbers.length > 0 && (
          <div className="bg-red-500/20 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-red-400/50">
            <div className="text-center">
              <div className="text-red-300 text-sm md:text-base mb-2 md:mb-3 font-semibold">
                ❌ แต่ข้ามเลขที่น้อยกว่าไปแล้ว:
              </div>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {skippedNumbers.map((num, i) => (
                  <div
                    key={i}
                    className="text-2xl md:text-4xl font-bold text-red-300"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {revealedThisRound.length > 1 && (
          <div className="text-white/50 text-xs md:text-sm text-center mt-2 md:mt-3 mb-2 md:mb-3">
            (เปิดเลขสุดท้ายอัตโนมัติ)
          </div>
        )}

        {/* Correct/Incorrect */}
        {isCorrect !== undefined && (
          <>
            {isCorrect ? (
              <div className="text-center">
                <div className="text-5xl md:text-6xl mb-2">✅</div>
                <div className="text-xl md:text-2xl font-bold text-green-400">
                  ถูกต้อง!
                </div>
                <div className="text-white/70 mt-2 text-sm md:text-base">
                  นี่คือตัวเลขที่น้อยที่สุด
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl md:text-6xl mb-2">❌</div>
                <div className="text-xl md:text-2xl font-bold text-red-400">ผิด!</div>
                <div className="text-white/70 mt-2 text-sm md:text-base">
                  ข้ามตัวเลขไป - เสียหัวใจ {heartsLost} ดวง
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Revealed Numbers Progress */}
      <div className="bg-white/5 rounded-lg md:rounded-xl p-4">
        <h4 className="text-white font-bold mb-2 md:mb-3 text-center text-sm md:text-base">
          ตัวเลขที่เปิดแล้ว:
        </h4>
        <div className="flex flex-wrap justify-center gap-2">
          {gameState.revealedNumbers.map((num, i) => (
            <div
              key={i}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-lg md:text-xl font-bold ${
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

      {/* Auto-transition message with countdown */}
      <div className="text-center mt-4 md:mt-6">
        <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2 md:mb-3">
          {countdown}
        </div>
        <div className="text-white/70 text-sm md:text-base">
          {gameState.status === "won" || gameState.status === "lost" ? (
            <p>กำลังสรุปผล...</p>
          ) : (
            <p>กำลังเตรียมรอบต่อไป...</p>
          )}
        </div>
      </div>
        </div>
      </div>
    </>
  );
}
