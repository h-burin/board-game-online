/**
 * Custom Hook: useItoGame
 * Real-time updates สำหรับเกม ITO
 */

import { useEffect, useState } from 'react';
import { doc, collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ItoGameState, ItoPlayerAnswer } from '@/types/ito';

interface UseItoGameResult {
  gameState: ItoGameState | null;
  playerAnswers: ItoPlayerAnswer[];
  myAnswer: ItoPlayerAnswer | null;
  myAnswers: ItoPlayerAnswer[]; // All answers for current player (for multi-number levels)
  loading: boolean;
  error: string | null;
}

export function useItoGame(sessionId: string, playerId: string | null): UseItoGameResult {
  const [gameState, setGameState] = useState<ItoGameState | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<ItoPlayerAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to game state
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'game_sessions', sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Convert Timestamp to Date
          const state: ItoGameState = {
            id: data.id,
            roomId: data.roomId,
            gameId: data.gameId,

            // Level system
            currentLevel: data.currentLevel || 1,
            totalLevels: data.totalLevels || 3,

            hearts: data.hearts || 3,
            currentRound: data.currentRound || 1,
            totalRounds: data.totalRounds || 0,
            questionId: data.questionId || '',
            questionText: data.questionText || '',
            phase: data.phase || 'waiting',
            phaseEndTime: data.phaseEndTime ? (data.phaseEndTime as Timestamp).toDate() : undefined,
            revealedNumbers: data.revealedNumbers || [],
            status: data.status || 'playing',
            startedAt: data.startedAt ? (data.startedAt as Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
          };

          setGameState(state);
          setError(null);
        } else {
          setError('ไม่พบ game session');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  // Subscribe to player answers
  useEffect(() => {
    if (!sessionId) return;

    const answersRef = collection(db, `game_sessions/${sessionId}/player_answers`);

    const unsubscribe = onSnapshot(
      answersRef,
      (snapshot) => {
        const answers: ItoPlayerAnswer[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          answers.push({
            playerId: data.playerId,
            playerName: data.playerName,
            number: data.number,
            answer: data.answer || '',
            submittedAt: data.submittedAt ? (data.submittedAt as Timestamp).toDate() : undefined,
            isRevealed: data.isRevealed || false,
            answerIndex: data.answerIndex || 0,
          });
        });

        setPlayerAnswers(answers);
      },
      () => {
        // Error handling for player answers listener
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  // Get my answers (all numbers for this player)
  const myAnswers = playerId ? playerAnswers.filter((a) => a.playerId === playerId) : [];
  const myAnswer = myAnswers.length > 0 ? myAnswers[0] : null;

  return {
    gameState,
    playerAnswers,
    myAnswer,
    myAnswers,
    loading,
    error,
  };
}
