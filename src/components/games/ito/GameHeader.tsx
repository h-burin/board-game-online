/**
 * Game Header Component
 * แสดงโจทย์, หัวใจ, และตัวนับเวลา
 * รองรับ Sticky Header ที่ย่อขนาดเมื่อ scroll
 */

"use client";

import { useState, useEffect } from "react";

interface GameHeaderProps {
  questionText: string;
  createdBy?: string;
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
  createdBy,
  revealedCount,
  totalRounds,
  hearts,
  phase,
  status,
  lastRevealResult,
  timeLeft,
  phaseEndTime,
}: GameHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  // ตรวจจับการ scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div
      className={`
        ${isScrolled ? "fixed" : "relative"} top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-xl shadow-2xl py-2 md:py-3 px-4 md:px-6"
            : "bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/20 my-4 md:my-6"
        }
      `}
    >
      {/* Compact Mode (เมื่อ scroll) */}
      {isScrolled ? (
        <div className="space-y-2">
          {/* บรรทัดที่ 1: โจทย์ + Home Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base text-white font-semibold truncate">
                {questionText}
              </p>
              {createdBy && (
                <p className="text-xs text-white/50 truncate mt-0.5">
                  สร้างโดย: {createdBy}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm text-blue-300 whitespace-nowrap">
                {revealedCount}/{totalRounds} เลข
              </span>
              {/* Home Button */}
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold p-2 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center"
                title="กลับหน้าหลัก"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 md:h-5 md:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* บรรทัดที่ 2: หัวใจ + Timer */}
          <div className="flex items-center justify-between">
            {/* หัวใจ */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`text-lg md:text-xl transition-all ${
                    i < currentHearts ? "text-red-500" : "text-gray-600 opacity-30"
                  }`}
                >
                  ❤️
                </div>
              ))}
              <span className="text-xs md:text-sm text-white/70 ml-2">
                {currentHearts} / 3
              </span>
            </div>

            {/* Timer */}
            {phase !== "finished" && phaseEndTime && timeLeft !== undefined && (
              <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Mode (ตอนไม่ scroll) */
        <>
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6">
            <div className="mb-4 md:mb-0 w-full md:w-auto text-center md:text-left">
              <h3 className="text-sm md:text-lg text-white/70 mb-1 md:mb-2">โจทย์:</h3>
              <p className="text-lg md:text-3xl font-bold text-white mb-1 md:mb-2">
                {questionText}
              </p>
              {createdBy && (
                <p className="text-xs md:text-sm text-white/50 mb-2">
                  สร้างโดย: {createdBy}
                </p>
              )}
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
        </>
      )}
    </div>
  );
}
