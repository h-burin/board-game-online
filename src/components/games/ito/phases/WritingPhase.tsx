/**
 * Writing Phase Component
 * Phase สำหรับพิมพ์คำใบ้
 */

"use client";
import { LuChevronRight, LuChevronDown } from "react-icons/lu";
import { useState } from "react";
import RevealedNumbersList from "../RevealedNumbersList";
import {
  calculatePlayerSubmissionStatus,
  separateCompletedPlayers,
} from "@/lib/utils/playerStatusUtils";

type ItoPlayerAnswer = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
};

type ItoPlayerAnswerWithIndex = ItoPlayerAnswer & {
  answerIndex: number;
};

interface WritingPhaseProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
  playerAnswers: ItoPlayerAnswer[];
  gameState: {
    currentLevel: number;
    revealedNumbers: number[];
  };
  answers: { [answerIndex: number]: string };
  setAnswers: (answers: { [answerIndex: number]: string }) => void;
  submitting: boolean;
  handleSubmitAnswer: (answerIndex: number) => Promise<void>;
  handleEditAnswer: (answerIndex: number) => Promise<void>;
}

export default function WritingPhase({
  myAnswers,
  playerAnswers,
  gameState,
  answers,
  setAnswers,
  submitting,
  handleSubmitAnswer,
  handleEditAnswer,
}: WritingPhaseProps) {
  const [showStatus, setShowStatus] = useState(false);

  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;
  const expectedAnswersPerPlayer = gameState.currentLevel;

  const playerSubmissionStatus = calculatePlayerSubmissionStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );

  const { playersCompleted, playersNotCompleted } = separateCompletedPlayers(
    playerSubmissionStatus
  );

  // คำนวณจำนวนคำใบ้ที่ส่งแล้ว vs จำนวนทั้งหมด
  const totalHintsExpected = totalPlayers * expectedAnswersPerPlayer;
  const totalHintsSubmitted = playerAnswers.filter(
    (ans) => ans.answer.trim() !== "" && ans.submittedAt
  ).length;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-white/20">
      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
        พิมพ์คำใบ้ของคุณ
      </h3>
      <p className="text-white/70 mb-4 md:mb-6 text-sm md:text-base">
        ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
      </p>

      {/* ประวัติเลขที่เปิดแล้ว */}
      <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} />

      {/* แสดงช่องกรอกแยกสำหรับแต่ละเลข */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {myAnswers
          .sort((a, b) => a.answerIndex - b.answerIndex)
          .map((ans) => {
            const isSubmitted = !!ans.submittedAt;
            return (
              <div
                key={ans.answerIndex}
                className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10"
              >
                {/* เลขที่ */}
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="text-white/70 text-sm md:text-base">
                    {myAnswers.length > 1
                      ? `เลขที่ ${ans.answerIndex + 1}:`
                      : "เลขของคุณ:"}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                    {ans.number}
                  </div>
                </div>

                {/* ช่องกรอกคำใบ้ */}
                <textarea
                  className="w-full p-3 md:p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none text-sm md:text-base"
                  rows={3}
                  placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                  value={answers[ans.answerIndex] || ""}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [ans.answerIndex]: e.target.value,
                    })
                  }
                  disabled={isSubmitted}
                />

                {/* ปุ่มส่ง / แก้ไข */}
                {!isSubmitted ? (
                  <button
                    onClick={() => handleSubmitAnswer(ans.answerIndex)}
                    disabled={!answers[ans.answerIndex]?.trim() || submitting}
                    className="mt-2 md:mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 md:py-3 rounded-xl transition-all transform hover:scale-105 text-sm md:text-base"
                  >
                    {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                  </button>
                ) : (
                  <div className="mt-2 md:mt-3 space-y-2">
                    <div className="text-center text-green-400 font-bold text-sm md:text-base">
                      ✓ ส่งคำตอบแล้ว
                    </div>
                    <button
                      onClick={() => handleEditAnswer(ans.answerIndex)}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded-xl transition-all text-sm md:text-base"
                    >
                      {submitting ? "กำลังยกเลิก..." : "แก้ไขคำตอบ"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ปุ่มส่งทั้งหมด - แสดงเฉพาะเมื่อมีหลายคำตอบและพิมพ์ครบแล้ว */}
      {myAnswers.length > 1 &&
        (() => {
          const allFilled = myAnswers.every((ans) =>
            answers[ans.answerIndex]?.trim()
          );
          const hasUnsubmitted = myAnswers.some((ans) => !ans.submittedAt);

          return allFilled && hasUnsubmitted ? (
            <button
              onClick={async () => {
                for (const ans of myAnswers) {
                  if (!ans.submittedAt && answers[ans.answerIndex]?.trim()) {
                    await handleSubmitAnswer(ans.answerIndex);
                  }
                }
              }}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 text-base md:text-lg shadow-lg mt-4 md:mt-6"
            >
              {submitting ? "กำลังส่ง..." : "ส่งคำใบ้ทั้งหมด"}
            </button>
          ) : null;
        })()}

      {/* แสดงสถานะรวม */}
      {myAnswers.every((ans) => ans.submittedAt) && (
        <div className="mt-4 md:mt-6 text-center text-green-400 font-bold text-base md:text-lg">
          ✓ ส่งคำตอบครบทุกเลขแล้ว รอผู้เล่นคนอื่น...
        </div>
      )}

      {/* สถานะผู้เล่น - Minimal Design */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <button
          onClick={() => setShowStatus(!showStatus)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs"
        >
          <span>💭</span>
          <span>
            สถานะการส่งคำใบ้: {totalHintsSubmitted}/{totalHintsExpected}
          </span>
          <span className="ml-1">
            {showStatus ? <LuChevronDown /> : <LuChevronRight />}
          </span>
        </button>

        {showStatus && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {playersCompleted.map((p, i) => (
              <div
                key={i}
                className="px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30"
              >
                ✓ {p.playerName}
              </div>
            ))}
            {playersNotCompleted.map(([id, p]) => (
              <div
                key={id}
                className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded border border-orange-500/30"
              >
                {p.playerName} ({p.submittedCount}/{p.totalExpected})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
