/**
 * Writing Phase Component
 * Phase สำหรับพิมพ์คำใบ้
 */

"use client";

import PlayerStatusTracker from "../PlayerStatusTracker";
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
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;
  const expectedAnswersPerPlayer = gameState.currentLevel;

  const playerSubmissionStatus = calculatePlayerSubmissionStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );

  const { playersCompleted, playersNotCompleted } =
    separateCompletedPlayers(playerSubmissionStatus);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-white/20">
      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
        พิมพ์คำใบ้ของคุณ
      </h3>
      <p className="text-white/70 mb-4 md:mb-6 text-sm md:text-base">
        ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
      </p>

      {/* สถานะการส่งคำใบ้ของผู้เล่น */}
      <PlayerStatusTracker
        title="สถานะการส่งคำใบ้"
        playersCompleted={playersCompleted}
        playersNotCompleted={playersNotCompleted}
        totalPlayers={totalPlayers}
      />

      {/* ประวัติเลขที่เปิดแล้ว */}
      <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} />

      {/* แสดงช่องกรอกแยกสำหรับแต่ละเลข */}
      <div className="space-y-4 md:space-y-6">
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
                    disabled={
                      !answers[ans.answerIndex]?.trim() || submitting
                    }
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
                      {submitting ? "กำลังยกเลิก..." : "✏️ แก้ไขคำตอบ"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* แสดงสถานะรวม */}
      {myAnswers.every((ans) => ans.submittedAt) && (
        <div className="mt-4 md:mt-6 text-center text-green-400 font-bold text-base md:text-lg">
          ✓ ส่งคำตอบครบทุกเลขแล้ว รอผู้เล่นคนอื่น...
        </div>
      )}
    </div>
  );
}
