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

  const prevAnswersRef = useRef<string>("");
  const prevLevelRef = useRef<number>(0);
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

  // Auto-transition from Writing to Voting when all players submitted
  useEffect(() => {
    if (!gameState || gameState.phase !== "writing") return;
    if (playerAnswers.length === 0) return;

    const uniquePlayerIds = Array.from(
      new Set(playerAnswers.map((a) => a.playerId))
    );
    const expectedAnswersPerPlayer = gameState.currentLevel;
    const totalExpectedAnswers = uniquePlayerIds.length * expectedAnswersPerPlayer;

    // ตรวจสอบว่าทุกคนส่งคำใบ้ครบหรือยัง
    const allSubmitted = playerAnswers.every(
      (ans) => ans.answer.trim() !== "" && ans.submittedAt !== undefined && ans.submittedAt !== null
    );

    const hasCorrectCount = playerAnswers.length === totalExpectedAnswers;

    if (allSubmitted && hasCorrectCount) {
      // เรียก API เพื่อเริ่ม Voting Phase พร้อม timer
      const startVoting = async () => {
        try {
          const response = await fetch(`/api/games/ito/${sessionId}/startVoting`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: gameState.roomId }),
          });

          if (!response.ok) {
            console.error("Failed to start voting phase");
          }
        } catch (error) {
          console.error("Error starting voting phase:", error);
        }
      };

      startVoting();
    }
  }, [gameState, playerAnswers, sessionId]);

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

  // Handle reveal votes (ไม่ต้อง setState อีกแล้ว - Firestore จะ sync ให้)
  const handleRevealVotes = useCallback(async () => {
    if (revealing) return;

    setRevealing(true);
    try {
      await fetch(`/api/games/ito/${sessionId}/reveal`, {
        method: "POST",
      });
      // ไม่ต้อง setLastRevealResult อีกแล้ว เพราะ Firestore จะ update และ useItoGame จะดึงมาให้
    } catch (error) {
      console.error('Reveal error:', error);
    } finally {
      setTimeout(() => setRevealing(false), 2000);
    }
  }, [revealing, sessionId]);

  // Reset flags when entering voting phase
  useEffect(() => {
    if (gameState?.phase === "voting") {
      // ไม่ต้อง setLastRevealResult อีกแล้ว เพราะ Firestore จะ clear ให้ใน startVotingPhase
      // Reset flag และ timer เมื่อเข้า voting phase ใหม่
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

    // นับจำนวนผู้เล่นและคำตอบที่คาดหวัง
    const uniquePlayerIds = Array.from(
      new Set(playerAnswers.map((a) => a.playerId))
    );
    const totalPlayers = uniquePlayerIds.length;
    const expectedAnswersPerPlayer = gameState.currentLevel;

    // เช็คว่า voteCount เพิ่มขึ้นจริงๆ (มีคนโหวตเพิ่ม)
    if (voteCount < prevVoteCountRef.current) {
      prevVoteCountRef.current = voteCount;
      return;
    }

    // ถ้า voteCount ไม่เปลี่ยน และยังไม่ครบทุกคน ให้ return
    if (voteCount === prevVoteCountRef.current && voteCount < totalPlayers) {
      return;
    }

    prevVoteCountRef.current = voteCount;

    // เช็คว่าแต่ละคนมีคำตอบที่ยังไม่เปิดอย่างน้อย 1 ตัว
    const unrevealedAnswers = playerAnswers.filter(a => !a.isRevealed);
    const hasUnrevealedAnswersToVote = unrevealedAnswers.length > 0;

    // เช็คว่าทุกคนมีคำตอบครบสำหรับ level นี้ (นับรวมที่เปิดแล้ว)
    const allPlayersHaveAllAnswers = uniquePlayerIds.every(playerId => {
      const playerTotalAnswers = playerAnswers.filter(a => a.playerId === playerId);
      return playerTotalAnswers.length === expectedAnswersPerPlayer;
    });

    if (
      totalPlayers >= 2 &&
      hasUnrevealedAnswersToVote &&
      allPlayersHaveAllAnswers &&
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

    // เมื่อหมดเวลา และต้องอยู่ใน voting phase จริงๆ
    // ไม่ต้องเช็ค voteCount > 0 อีกต่อไป (API จะจัดการกรณีไม่มี vote ให้)
    if (
      timeLeft === 0 &&
      gameState.phase === "voting" &&
      playerAnswers.length > 0
    ) {
      handleRevealVotes();
    }
  }, [timeLeft, gameState, revealing, playerAnswers, handleRevealVotes]);

  // Count remaining time (เฉพาะ Voting Phase เท่านั้น)
  useEffect(() => {
    if (!gameState || !gameState.phaseEndTime) {
      setTimeLeft(0);
      return;
    }

    // ไม่แสดง timer ใน Writing Phase
    if (gameState.phase === "writing") {
      setTimeLeft(0);
      return;
    }

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
  }, [gameState?.phaseEndTime, gameState?.phase]);

  // Auto-transition from reveal phase
  useEffect(() => {
    if (!gameState || gameState.phase !== "reveal") return;

    const timer = setTimeout(async () => {
      const sessionRef = doc(db, "game_sessions", sessionId);
      const allRevealedInLevel =
        gameState.revealedNumbers.length >= gameState.totalRounds;

      console.log('🎮 [Frontend] Auto-transition check:', {
        phase: gameState.phase,
        status: gameState.status,
        revealedCount: gameState.revealedNumbers.length,
        totalRounds: gameState.totalRounds,
        revealedNumbers: gameState.revealedNumbers,
        allRevealedInLevel,
        willTransitionTo:
          gameState.status === "lost" ? "finished (lost)" :
          gameState.status === "won" ? "finished (won)" :
          allRevealedInLevel ? "levelComplete" : "voting"
      });

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
        await startVotingPhase(sessionId, gameState.roomId);
      }
    }, 8000);

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
    <div className="relative">
      {/* Game Header - Sticky */}
      <GameHeader
        questionText={gameState.questionText}
        createdBy={gameState.questionCreatedBy}
        revealedCount={gameState.revealedNumbers.length}
        totalRounds={gameState.totalRounds}
        hearts={gameState.hearts}
        phase={gameState.phase}
        status={gameState.status}
        lastRevealResult={gameState.lastRevealResult || null}
        timeLeft={timeLeft}
        phaseEndTime={gameState.phaseEndTime}
      />

      {/* Content Container */}
      <div className="space-y-4 md:space-y-6">
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
          lastRevealResult={gameState.lastRevealResult || null}
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
    </div>
  );
}
