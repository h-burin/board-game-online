/**
 * ITO Game Component (Refactored)
 * เกมความสามัคคี - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

"use client";

import { useState, useEffect, useRef } from "react";
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
  const { votes, voteCount } = useVotes(sessionId);
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

  // Clear answers when level changes
  useEffect(() => {
    if (!gameState) return;

    if (prevLevelRef.current === 0) {
      prevLevelRef.current = gameState.currentLevel;
      return;
    }

    if (prevLevelRef.current !== gameState.currentLevel) {
      console.log(
        `🔄 Level changed from ${prevLevelRef.current} to ${gameState.currentLevel}, clearing answers`
      );
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

    if (success) {
      console.log("✅ Answer submitted successfully for index", answerIndex);
    } else {
      alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
    }
    setSubmitting(false);
  };

  // Handle edit answer
  const handleEditAnswer = async (answerIndex: number) => {
    if (submitting) return;

    setSubmitting(true);
    const success = await unsendPlayerAnswer(sessionId, playerId, answerIndex);

    if (success) {
      console.log("✅ Answer unsent for editing at index", answerIndex);
    } else {
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

    if (success) {
      console.log("✅ Vote submitted successfully for:", selectedAnswerId);
    } else {
      alert("เกิดข้อผิดพลาดในการโหวต");
    }
    setSubmitting(false);
  };

  // Reset lastRevealResult when entering voting phase
  useEffect(() => {
    if (gameState?.phase === "voting") {
      setLastRevealResult(null);
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

    const uniquePlayerIds = Array.from(
      new Set(playerAnswers.map((a) => a.playerId))
    );
    const totalPlayers = uniquePlayerIds.length;

    if (voteCount === totalPlayers && voteCount > 0) {
      console.log("✅ All votes submitted, revealing results");
      handleRevealVotes();
    }
  }, [voteCount, gameState, playerAnswers, revealing]);

  // Auto-reveal when time runs out
  useEffect(() => {
    if (!gameState || revealing) return;

    if (timeLeft === 0 && gameState.phase === "voting" && voteCount > 0) {
      console.log("⏰ Time is up, revealing results");
      handleRevealVotes();
    }
  }, [timeLeft, gameState, voteCount, revealing]);

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

  // Handle reveal votes
  const handleRevealVotes = async () => {
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
    } catch (error) {
      console.error("❌ Error revealing votes:", error);
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  };

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
        console.log("✅ All players ready, starting next level");

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

          const data = await response.json();

          if (!data.success) {
            console.error("❌ Failed to start next level:", data.error);
          }
        } catch (error) {
          console.error("❌ Error starting next level:", error);
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
    <div className="space-y-6">
      {/* Fixed Home Button */}
      <button
        onClick={() => (window.location.href = "/")}
        className="fixed top-6 right-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold p-3 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 flex items-center justify-center"
        title="กลับหน้าหลัก"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
