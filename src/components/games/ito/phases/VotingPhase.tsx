/**
 * Voting Phase Component
 * Phase สำหรับโหวตคำใบ้
 */

"use client";

import { useState } from "react";
import RevealedNumbersList from "../RevealedNumbersList";
import {
  calculatePlayerHintStatus,
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

type ItoVote = {
  playerId: string;
  votedForPlayerId: string;
  votedForAnswerIndex: number;
};

interface VotingPhaseProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
  playerAnswers: ItoPlayerAnswer[];
  votes: ItoVote[];
  voteCount: number;
  playerId: string;
  gameState: {
    currentLevel: number;
    revealedNumbers: number[];
  };
  answers: { [answerIndex: number]: string };
  setAnswers: (answers: { [answerIndex: number]: string }) => void;
  selectedAnswerId: string | null;
  setSelectedAnswerId: (id: string | null) => void;
  submitting: boolean;
  handleSubmitAnswer: (answerIndex: number) => Promise<void>;
  handleSubmitVote: () => Promise<void>;
}

export default function VotingPhase({
  myAnswers,
  playerAnswers,
  votes,
  voteCount,
  playerId,
  gameState,
  answers,
  setAnswers,
  selectedAnswerId,
  setSelectedAnswerId,
  submitting,
  handleSubmitAnswer,
  handleSubmitVote,
}: VotingPhaseProps) {
  const [statusTab, setStatusTab] = useState<"hints" | "votes">("hints");

  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  const totalPlayers = uniquePlayerIds.length;
  const expectedAnswersPerPlayer = gameState.currentLevel;

  const playerSubmissionStatus = calculatePlayerHintStatus(
    playerAnswers,
    expectedAnswersPerPlayer
  );

  const { playersCompleted, playersNotCompleted } =
    separateCompletedPlayers(playerSubmissionStatus);

  const allPlayersSubmittedAll = Object.values(
    playerSubmissionStatus
  ).every((p) => p.submittedCount === p.totalExpected);

  const votedPlayerIds = votes.map((v) => v.playerId);
  const playersWhoVoted = uniquePlayerIds.filter((id) =>
    votedPlayerIds.includes(id)
  );
  const playersWhoNotVoted = uniquePlayerIds.filter(
    (id) => !votedPlayerIds.includes(id)
  );

  // คำนวณจำนวนคำใบ้ที่ส่งแล้ว vs จำนวนทั้งหมด
  const totalHintsExpected = totalPlayers * expectedAnswersPerPlayer;
  const totalHintsSubmitted = playerAnswers.filter(
    (ans) => ans.answer.trim() !== "" && ans.submittedAt
  ).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ส่วนพิมพ์คำใบ้ของตัวเอง */}
      {myAnswers.filter((ans) => !ans.isRevealed).length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-purple-400/30">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
            คำใบ้ของคุณ
          </h3>
          <p className="text-white/70 mb-4 md:mb-6 text-sm md:text-base">
            คุณสามารถแก้ไขคำใบ้ได้ตลอดจนกว่าจะถูกเปิด
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {myAnswers
              .filter((ans) => !ans.isRevealed)
              .sort((a, b) => a.answerIndex - b.answerIndex)
              .map((ans) => (
                <div
                  key={ans.answerIndex}
                  className="bg-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20"
                >
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

                  <textarea
                    className="w-full p-3 md:p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none text-sm md:text-base"
                    rows={2}
                    placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                    value={answers[ans.answerIndex] || ""}
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [ans.answerIndex]: e.target.value,
                      })
                    }
                  />

                  <button
                    onClick={() => handleSubmitAnswer(ans.answerIndex)}
                    disabled={
                      !answers[ans.answerIndex]?.trim() || submitting
                    }
                    className={`mt-2 md:mt-3 w-full font-bold py-2 rounded-xl transition-all text-sm md:text-base ${
                      ans.answer
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-500 disabled:to-gray-600"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600"
                    } disabled:cursor-not-allowed text-white`}
                  >
                    {submitting
                      ? "กำลังบันทึก..."
                      : ans.answer
                      ? "อัปเดตคำใบ้"
                      : "บันทึกคำใบ้"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ส่วนโหวต */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-white/20">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
          เลือกคำใบ้ที่น้อยที่สุด
        </h3>
        <p className="text-white/70 mb-3 md:mb-4 text-sm md:text-base">
          คลิกเลือกคำใบ้ที่คุณคิดว่าสื่อถึงตัวเลขที่น้อยที่สุด
        </p>

        {/* ประวัติเลขที่เปิดแล้ว */}
        <RevealedNumbersList revealedNumbers={gameState.revealedNumbers} />

        {/* แสดง warning หากยังพิมพ์ไม่ครบ */}
        {!allPlayersSubmittedAll && (
          <div className="text-center text-orange-300 text-sm mb-4 bg-orange-500/20 rounded-lg py-2">
            ⚠️ รอให้ทุกคนพิมพ์คำใบ้ครบก่อนโหวต
          </div>
        )}

        {/* ส่วนโหวต - แสดงเฉพาะเมื่อทุกคนส่งครบแล้ว */}
        {allPlayersSubmittedAll ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              {playerAnswers
                .filter((a) => !a.isRevealed && a.answer.trim() !== "")
                .map((playerAnswer) => {
                  const answerWithIndex =
                    playerAnswer as ItoPlayerAnswerWithIndex;
                  const answerId = `${answerWithIndex.playerId}_${answerWithIndex.answerIndex}`;

                  // หาว่าใครโหวตคำใบ้นี้บ้าง
                  const votersForThisAnswer = votes.filter(
                    (v) =>
                      v.votedForPlayerId === answerWithIndex.playerId &&
                      v.votedForAnswerIndex === answerWithIndex.answerIndex
                  );

                  // ดึงชื่อผู้โหวต
                  const voterNames = votersForThisAnswer
                    .map((v) => {
                      const voter = playerAnswers.find(
                        (a) => a.playerId === v.playerId
                      );
                      return voter?.playerName || "Unknown";
                    })
                    .filter((name, index, self) => self.indexOf(name) === index); // unique

                  return (
                    <button
                      key={answerId}
                      onClick={() => setSelectedAnswerId(answerId)}
                      className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedAnswerId === answerId
                          ? "border-yellow-400 bg-yellow-500/30"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-white/70 text-xs md:text-sm mb-2">
                        {playerAnswer.playerName}
                      </div>
                      <div className="text-white text-lg md:text-2xl font-semibold">
                        {playerAnswer.answer}
                      </div>
                      {playerAnswer.playerId === playerId && (
                        <div className="text-blue-300 text-xs md:text-sm mt-2">
                          (คำใบ้ของคุณ)
                        </div>
                      )}

                      {/* แสดงว่าใครโหวตคำใบ้นี้ */}
                      {voterNames.length > 0 && (
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 from-green-500/20 to-blue-500/20">
                          <div className="flex items-center gap-2 mb-2 justify-center">
                            <div className="flex items-center  justify-center w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full">
                              <span className="text-white text-xs font-bold">
                                {voterNames.length}
                              </span>
                            </div>
                            <span className="text-green-400 text-xs md:text-sm font-semibold">
                              โหวต
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
                            {voterNames.map((name, idx) => (
                              <div
                                key={idx}
                                className="group relative px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 hover:from-green-500/40 hover:to-emerald-500/40 border border-green-400/30 rounded-lg transition-all duration-200 hover:scale-105"
                              >
                                <span className="text-green-200 text-xs md:text-sm font-medium">
                                  {name}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={handleSubmitVote}
              disabled={!selectedAnswerId || submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันการเลือก"}
            </button>
          </>
        ) : (
          <div className="text-center py-6 md:py-8 bg-gray-500/20 rounded-xl md:rounded-2xl">
            <div className="text-white/70 text-base md:text-lg mb-2">
              ⏳ รอให้ทุกคนพิมพ์คำใบ้ครบก่อน
            </div>
            <div className="text-white/50 text-xs md:text-sm">
              จึงจะสามารถโหวตได้
            </div>
          </div>
        )}

        {/* สถานะผู้เล่น - Minimal Design */}
        <div className="mt-6 flex gap-3 text-xs text-white/60">
          <button
            onClick={() => setStatusTab("hints")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              statusTab === "hints"
                ? "bg-white/10 text-white"
                : "hover:bg-white/5"
            }`}
          >
            <span>💭</span>
            <span>คำใบ้: {totalHintsSubmitted}/{totalHintsExpected}</span>
          </button>
          <button
            onClick={() => setStatusTab("votes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              statusTab === "votes"
                ? "bg-white/10 text-white"
                : "hover:bg-white/5"
            }`}
          >
            <span>🗳️</span>
            <span>โหวต: {voteCount}/{totalPlayers}</span>
          </button>
        </div>

        {/* แสดงรายละเอียดตาม tab ที่เลือก */}
        {statusTab === "hints" && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {playersCompleted.map((p, i) => (
              <div
                key={i}
                className="px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30"
              >
                {p.playerName}
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

        {statusTab === "votes" && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {playersWhoVoted.map((id) => {
              const player = playerAnswers.find((a) => a.playerId === id);
              return (
                <div
                  key={id}
                  className="px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30"
                >
                  {player?.playerName}
                </div>
              );
            })}
            {playersWhoNotVoted.map((id) => {
              const player = playerAnswers.find((a) => a.playerId === id);
              return (
                <div
                  key={id}
                  className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded border border-orange-500/30"
                >
                  {player?.playerName}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
