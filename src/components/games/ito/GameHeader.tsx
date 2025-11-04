/**
 * Game Header Component
 * แสดงโจทย์, หัวใจ, และตัวนับเวลา
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
      style={{ position: 'sticky', top: 10, zIndex: 50 }}
      className={`bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl my-2 mb-3 md:mb-6 transition-all duration-300 ease-in-out ${
        isScrolled ? 'scale-95' : 'scale-100'
      }`}
    >
      <div className={`max-w-6xl mx-auto px-3 md:px-4 transition-all duration-300 ease-in-out ${
        isScrolled ? 'py-1.5 md:py-2' : 'py-2 md:py-3'
      }`}>
        {/* Desktop Layout */}
        <div className="hidden md:flex items-stretch justify-between gap-4">
          {/* Left: Question */}
          <div className={`flex-1 min-w-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 ease-in-out ${
            isScrolled ? 'py-2' : 'py-3'
          }`}>
            <h2 className={`font-bold text-yellow-100 truncate transition-all duration-300 ease-in-out ${
              isScrolled ? 'text-lg' : 'text-xl'
            }`}>
              โจทย์ : {questionText}
            </h2>
            <div className={`flex items-center gap-3 transition-all duration-300 ease-in-out ${
              isScrolled ? 'mt-0 opacity-0 h-0' : 'mt-0.5 opacity-100 h-auto'
            }`}>
              {createdBy && (
                <p className="text-xs text-white/60">โดย {createdBy}</p>
              )}
              <span className="text-xs text-white/40">•</span>
              <p className="text-xs text-blue-300">
                {revealedCount}/{totalRounds} เลข
              </p>
            </div>
          </div>

          {/* Center: Hearts */}
          <div className={`flex items-center gap-2 px-4 bg-white/5 rounded-xl border border-white/10 transition-all duration-300 ease-in-out ${
            isScrolled ? 'py-2' : 'py-3'
          }`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`transition-all duration-300 ease-in-out ${
                isScrolled ? 'text-xl' : 'text-2xl'
              } ${i < currentHearts ? "opacity-100" : "opacity-30"}`}>
                ❤️
              </span>
            ))}
          </div>

          {/* Right: Timer */}
          {phase !== "finished" && phaseEndTime && timeLeft !== undefined && (
            <div className={`flex items-center gap-2 px-4 bg-white/5 rounded-xl border border-white/10 transition-all duration-300 ease-in-out ${
              isScrolled ? 'py-2' : 'py-3'
            }`}>
              <svg className={`text-yellow-300 transition-all duration-300 ease-in-out ${
                isScrolled ? 'w-4 h-4' : 'w-5 h-5'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-bold text-yellow-300 tabular-nums transition-all duration-300 ease-in-out ${
                isScrolled ? 'text-lg' : 'text-xl'
              }`}>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-2">
          {/* Question */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg px-3 py-2">
            <h2 className="text-base font-bold text-yellow-100 truncate">
              {questionText}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {createdBy && (
                <p className="text-xs text-white/60 truncate">โดย {createdBy}</p>
              )}
              <span className="text-xs text-white/40">•</span>
              <p className="text-xs text-blue-300">
                {revealedCount}/{totalRounds}
              </p>
            </div>
          </div>

          {/* Hearts + Timer Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Hearts */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xl transition-opacity duration-300 ${i < currentHearts ? "opacity-100" : "opacity-30"}`}>
                  ❤️
                </span>
              ))}
            </div>

            {/* Timer */}
            {phase !== "finished" && phaseEndTime && timeLeft !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold text-yellow-300 tabular-nums">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
