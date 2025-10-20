/**
 * Custom Hook: useVoteManagement
 * Manages vote selection, submission, and restoration logic
 */

import { useState, useEffect, useCallback } from 'react';
import { submitVote as submitVoteToFirebase } from '@/lib/firebase/ito';
import { useVotes } from './useVotes';
import {
  parseAnswerId,
  restoreVoteSelection,
  hasAllPlayersVoted,
} from '@/lib/utils/voteUtils';
import type { ItoGameState, ItoPlayerAnswer } from '@/types/ito';

interface UseVoteManagementProps {
  sessionId: string;
  playerId: string;
  gameState: ItoGameState | null;
  playerAnswers: ItoPlayerAnswer[];
  onAllVotesSubmitted?: () => void;
}

interface UseVoteManagementReturn {
  selectedAnswerId: string | null;
  submitting: boolean;
  votes: any[];
  voteCount: number;
  selectAnswer: (answerId: string | null) => void;
  submitVote: () => Promise<void>;
  hasVoted: boolean;
}

export function useVoteManagement({
  sessionId,
  playerId,
  gameState,
  playerAnswers,
  onAllVotesSubmitted,
}: UseVoteManagementProps): UseVoteManagementReturn {
  const { votes, voteCount } = useVotes(sessionId);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Restore vote selection if player already voted (prevents loss on refresh)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'voting') {
      return;
    }

    if (!votes || votes.length === 0) {
      return;
    }

    // Only restore if not already set
    if (!selectedAnswerId) {
      const restoredAnswerId = restoreVoteSelection(votes, playerId);

      if (restoredAnswerId) {
        console.log('🔄 Restoring vote selection:', restoredAnswerId);
        setSelectedAnswerId(restoredAnswerId);
      }
    }
  }, [votes, gameState, playerId, selectedAnswerId]);

  // Auto-check if all players have voted
  useEffect(() => {
    if (!gameState || gameState.phase !== 'voting') return;

    const allVoted = hasAllPlayersVoted(voteCount, playerAnswers);

    if (allVoted && onAllVotesSubmitted) {
      console.log('✅ All players have voted');
      onAllVotesSubmitted();
    }
  }, [voteCount, gameState, playerAnswers, onAllVotesSubmitted]);

  const selectAnswer = useCallback((answerId: string | null) => {
    setSelectedAnswerId(answerId);
  }, []);

  const submitVote = useCallback(async () => {
    if (!selectedAnswerId || submitting) return;

    const { playerId: votedPlayerId, answerIndex } = parseAnswerId(selectedAnswerId);

    setSubmitting(true);

    try {
      const success = await submitVoteToFirebase(
        sessionId,
        playerId,
        votedPlayerId,
        answerIndex
      );

      if (success) {
        console.log('✅ Vote submitted successfully:', selectedAnswerId);
        // Keep selectedAnswerId set so player can see their vote
      } else {
        throw new Error('Failed to submit vote');
      }
    } catch (error) {
      console.error('❌ Error submitting vote:', error);
      alert('เกิดข้อผิดพลาดในการโหวต กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }, [selectedAnswerId, submitting, sessionId, playerId]);

  const hasVoted = votes.some((v) => v.playerId === playerId);

  return {
    selectedAnswerId,
    submitting,
    votes,
    voteCount,
    selectAnswer,
    submitVote,
    hasVoted,
  };
}
