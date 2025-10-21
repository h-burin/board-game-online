/**
 * ITO Game Component (Refactored)
 * เกมความสามัคคี - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useItoGame } from "@/lib/hooks/useItoGame";
import { useVotes } from "@/lib/hooks/useVotes";
import { useReadyStatus } from "@/lib/hooks/useReadyStatus";
import {
  submitPlayerAnswer,
  unsendPlayerAnswer,
  submitVote,
  startVotingPhase,
} from "@/lib/firebase/ito";

// Components
import GameHeader from "./ito/GameHeader";
import MyNumbersDisplay from "./ito/MyNumbersDisplay";
import WritingPhase from "./ito/phases/WritingPhase";
import VotingPhase from "./ito/phases/VotingPhase";
import RevealPhase from "./ito/phases/RevealPhase";
import LevelCompletePhase from "./ito/phases/LevelCompletePhase";
import FinishedPhase from "./ito/phases/FinishedPhase";

interface ItoGameProps {
  sessionId: string;
  playerId: string;
}

// Extended type for answers with answerIndex
type ItoPlayerAnswerWithIndex = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
  answerIndex: number;
};

export default function ItoGame({ sessionId, playerId }: ItoGameProps) {
  const { gameState, playerAnswers, myAnswers, loading } = useItoGame(
    sessionId,
    playerId
  );
  const { votes, voteCount, loading: votesLoading } = useVotes(sessionId);
  const { readyPlayers, readyCount } = useReadyStatus(sessionId);

  const [answers, setAnswers] = useState<{ [answerIndex: number]: string }>({});
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [revealing, setRevealing] = useState(false);
  const [lastRevealResult, setLastRevealResult] = useState<{
    number: number;
    isCorrect: boolean;
    heartsLost: number;
    newHearts: number;
  } | null>(null);

  const prevAnswersRef = useRef<string>("");
  const prevLevelRef = useRef<number>(0);
  const isInitialMount = useRef<boolean>(true);
  const prevVoteCountRef = useRef<number>(0);
  const hasLoadedVotesRef = useRef<boolean>(false);
  const mountTimeRef = useRef<number>(Date.now());

  // Clear answers when level changes
  useEffect(() => {
    if (!gameState) return;

    if (prevLevelRef.current === 0) {
      prevLevelRef.current = gameState.currentLevel;
      return;
    }

    if (prevLevelRef.current !== gameState.currentLevel) {
      setAnswers({});
      prevAnswersRef.current = "";
      prevLevelRef.current = gameState.currentLevel;
    }
  }, [gameState?.currentLevel]);

  // Auto-fill answers if already submitted
  useEffect(() => {
    if (!gameState || myAnswers.length === 0) return;

    const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];
    const expectedAnswersCount = gameState.currentLevel;

    if (myAnswers.length !== expectedAnswersCount) {
      return;
    }

    const hasStaleData = answersWithIndex.some(
      (ans) => ans.answer !== "" && !ans.submittedAt
    );

    if (hasStaleData) {
      return;
    }

    const answersKey = `L${gameState.currentLevel}|${answersWithIndex
      .map(
        (a) => `${a.answerIndex}:${a.answer || ""}:${a.submittedAt ? "1" : "0"}`
      )
      .sort()
      .join("|")}`;

    if (prevAnswersRef.current === answersKey) return;

    prevAnswersRef.current = answersKey;

    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };
      answersWithIndex.forEach((ans) => {
        if (ans.submittedAt) {
          newAnswers[ans.answerIndex] = ans.answer || "";
        } else if (!prevAnswers[ans.answerIndex]) {
          newAnswers[ans.answerIndex] = "";
        }
      });
      return newAnswers;
    });
  }, [myAnswers, gameState]);

  // Handle submit answer
  const handleSubmitAnswer = async (answerIndex: number) => {
    const answer = answers[answerIndex];
    if (!answer?.trim() || !gameState || submitting) return;

    setSubmitting(true);
    const success = await submitPlayerAnswer(
      sessionId,
      playerId,
      answer.trim(),
      answerIndex
    );

    if (!success) {
      alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
    }
    setSubmitting(false);
  };

  // Handle edit answer
  const handleEditAnswer = async (answerIndex: number) => {
    if (submitting) return;

    setSubmitting(true);
    const success = await unsendPlayerAnswer(sessionId, playerId, answerIndex);

    if (!success) {
      alert("เกิดข้อผิดพลาดในการแก้ไขคำตอบ");
    }
    setSubmitting(false);
  };

  // Handle submit vote
  const handleSubmitVote = async () => {
    if (!selectedAnswerId || submitting) return;

    const [votedPlayerId, answerIndexStr] = selectedAnswerId.split("_");
    const answerIndex = parseInt(answerIndexStr, 10);

    setSubmitting(true);
    const success = await submitVote(
      sessionId,
      playerId,
      votedPlayerId,
      answerIndex
    );

    if (!success) {
      alert("เกิดข้อผิดพลาดในการโหวต");
    }
    setSubmitting(false);
  };

  // Handle reveal votes
  const handleRevealVotes = useCallback(async () => {
    if (revealing) return;

    setRevealing(true);
    try {
      const response = await fetch(`/api/games/ito/${sessionId}/reveal`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setLastRevealResult({
          number: data.number,
          isCorrect: data.isCorrect,
          heartsLost: data.heartsLost,
          newHearts: data.newHearts,
        });
      }
    } catch {
      // Error handling
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  }, [revealing, sessionId]);

  // Reset lastRevealResult when entering voting phase
  useEffect(() => {
    if (gameState?.phase === "voting") {
      setLastRevealResult(null);
      // Reset flag และ timer เมื่อเข้า voting phase ใหม่
      isInitialMount.current = true;
      prevVoteCountRef.current = 0;
      hasLoadedVotesRef.current = false;
      mountTimeRef.current = Date.now(); // Reset timer สำหรับ voting phase ใหม่
    }
  }, [gameState?.phase]);

  // Restore vote selection if player already voted
  useEffect(() => {
    if (!gameState || gameState.phase !== "voting") return;
    if (!votes || votes.length === 0) return;

    const myVote = votes.find((v) => v.playerId === playerId);

    if (myVote && !selectedAnswerId) {
      const restoredAnswerId = `${myVote.votedForPlayerId}_${myVote.votedForAnswerIndex}`;
      setSelectedAnswerId(restoredAnswerId);
    }
  }, [votes, gameState, playerId, selectedAnswerId]);

  // Auto-check if all votes submitted
  useEffect(() => {
    if (!gameState || gameState.phase !== "voting" || revealing) return;

    // ห้าม auto-reveal ถ้า votes ยังโหลดไม่เสร็จ (ป้องกัน F5)
    if (votesLoading) return;

    // ห้าม auto-reveal ภายใน 2 วินาทีหลัง mount (ป้องกัน F5)
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount < 2000) return;

    // เมื่อ votesLoading เปลี่ยนจาก true → false ครั้งแรก = initial load
    if (!hasLoadedVotesRef.current) {
      hasLoadedVotesRef.current = true;
      prevVoteCountRef.current = voteCount;
      return;
    }

    // ข้าม initial mount (ตอน refresh)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevVoteCountRef.current = voteCount;
      return;
    }

    // เช็คว่า voteCount เพิ่มขึ้นจริงๆ (มีคนโหวตเพิ่ม)
    if (voteCount <= prevVoteCountRef.current) {
      prevVoteCountRef.current = voteCount;
      return;
    }

    prevVoteCountRef.current = voteCount;

    const uniquePlayerIds = Array.from(
      new Set(playerAnswers.map((a) => a.playerId))
    );
    const totalPlayers = uniquePlayerIds.length;
    const expectedAnswers = gameState.currentLevel * totalPlayers;
    const hasAllAnswers = playerAnswers.length === expectedAnswers;

    if (
      totalPlayers >= 2 &&
      hasAllAnswers &&
      voteCount === totalPlayers &&
      voteCount > 0
    ) {
      handleRevealVotes();
    }
  }, [voteCount, gameState, playerAnswers, revealing, handleRevealVotes, votesLoading]);

  // Auto-reveal when time runs out
  useEffect(() => {
    if (!gameState || revealing) return;

    // ป้องกัน auto-reveal เมื่อเพิ่ง mount (ต้องรอให้ load เวลาจริงจาก Firebase ก่อน)
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount < 2000) return;

    // เมื่อหมดเวลา ต้องมีการโหวตอย่างน้อย 1 vote
    // และต้องอยู่ใน voting phase จริงๆ
    if (
      timeLeft === 0 &&
      gameState.phase === "voting" &&
      voteCount > 0 &&
      playerAnswers.length > 0
    ) {
      handleRevealVotes();
    }
  }, [timeLeft, gameState, voteCount, revealing, playerAnswers, handleRevealVotes]);

  // Count remaining time
  useEffect(() => {
    if (!gameState || !gameState.phaseEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = gameState.phaseEndTime!.getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.phaseEndTime]);

  // Auto-transition from reveal phase
  useEffect(() => {
    if (!gameState || gameState.phase !== "reveal") return;

    const timer = setTimeout(async () => {
      const sessionRef = doc(db, "game_sessions", sessionId);
      const allRevealedInLevel =
        gameState.revealedNumbers.length >= gameState.totalRounds;

      if (gameState.status === "lost") {
        await updateDoc(sessionRef, {
          phase: "finished",
          updatedAt: serverTimestamp(),
        });
      } else if (gameState.status === "won") {
        await updateDoc(sessionRef, {
          phase: "finished",
          updatedAt: serverTimestamp(),
        });
      } else if (allRevealedInLevel) {
        await updateDoc(sessionRef, {
          phase: "levelComplete",
          updatedAt: serverTimestamp(),
        });
      } else {
        await startVotingPhase(sessionId);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [gameState, sessionId]);

  // Auto-check if all players ready (levelComplete phase)
  useEffect(() => {
    if (!gameState || gameState.phase !== "levelComplete") return;

    const checkReady = async () => {
      const uniquePlayerIds = Array.from(
        new Set(playerAnswers.map((a) => a.playerId))
      );
      const totalPlayers = uniquePlayerIds.length;

      if (readyCount === totalPlayers && totalPlayers > 0) {
        try {
          if (gameState.currentLevel >= gameState.totalLevels) {
            const sessionRef = doc(db, "game_sessions", sessionId);
            await updateDoc(sessionRef, {
              phase: "finished",
              status: "won",
              updatedAt: serverTimestamp(),
            });
            return;
          }

          const response = await fetch(
            `/api/games/ito/${sessionId}/nextLevel`,
            {
              method: "POST",
            }
          );

          await response.json();
        } catch {
          // Error handling
        }
      }
    };

    checkReady();
  }, [gameState, sessionId, readyCount, playerAnswers]);

  // Loading state
  if (loading || !gameState) {
    return (
      <div className="text-center text-white">
        <p className="text-xl">กำลังโหลดเกม...</p>
      </div>
    );
  }

  const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Fixed Home Button */}
      <button
        onClick={() => (window.location.href = "/")}
        className="fixed top-4 right-4 md:top-6 md:right-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold p-2.5 md:p-3 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 flex items-center justify-center"
        title="กลับหน้าหลัก"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 md:h-6 md:w-6"
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

      {/* Game Header */}
      <GameHeader
        questionText={gameState.questionText}
        revealedCount={gameState.revealedNumbers.length}
        totalRounds={gameState.totalRounds}
        hearts={gameState.hearts}
        phase={gameState.phase}
        status={gameState.status}
        lastRevealResult={lastRevealResult}
        timeLeft={timeLeft}
        phaseEndTime={gameState.phaseEndTime}
      />

      {/* My Numbers Display */}
      <MyNumbersDisplay myAnswers={answersWithIndex} />

      {/* Phase: Writing */}
      {gameState.phase === "writing" && (
        <WritingPhase
          myAnswers={answersWithIndex}
          playerAnswers={playerAnswers}
          gameState={gameState}
          answers={answers}
          setAnswers={setAnswers}
          submitting={submitting}
          handleSubmitAnswer={handleSubmitAnswer}
          handleEditAnswer={handleEditAnswer}
        />
      )}

      {/* Phase: Voting */}
      {gameState.phase === "voting" && (
        <VotingPhase
          myAnswers={answersWithIndex}
          playerAnswers={playerAnswers}
          votes={votes}
          voteCount={voteCount}
          playerId={playerId}
          gameState={gameState}
          answers={answers}
          setAnswers={setAnswers}
          selectedAnswerId={selectedAnswerId}
          setSelectedAnswerId={setSelectedAnswerId}
          submitting={submitting}
          handleSubmitAnswer={handleSubmitAnswer}
          handleSubmitVote={handleSubmitVote}
        />
      )}

      {/* Phase: Reveal */}
      {gameState.phase === "reveal" && (
        <RevealPhase
          playerAnswers={playerAnswers}
          gameState={gameState}
          lastRevealResult={lastRevealResult}
        />
      )}

      {/* Phase: Level Complete */}
      {gameState.phase === "levelComplete" && (
        <LevelCompletePhase
          sessionId={sessionId}
          playerId={playerId}
          playerAnswers={playerAnswers}
          readyPlayers={readyPlayers}
          readyCount={readyCount}
          gameState={gameState}
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      )}

      {/* Phase: Finished */}
      {gameState.phase === "finished" && (
        <FinishedPhase playerAnswers={playerAnswers} gameState={gameState} />
      )}
    </div>
  );
}
