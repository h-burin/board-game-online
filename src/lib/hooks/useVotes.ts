/**
 * Custom Hook: useVotes
 * Real-time updates สำหรับ votes
 */

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Vote {
  playerId: string;
  votedForPlayerId: string;
  votedForAnswerIndex: number;
}

interface UseVotesResult {
  votes: Vote[];
  voteCount: number;
  loading: boolean;
}

export function useVotes(sessionId: string): UseVotesResult {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const votesRef = collection(db, `game_sessions/${sessionId}/votes`);

    const unsubscribe = onSnapshot(
      votesRef,
      (snapshot) => {
        const votesData: Vote[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          votesData.push({
            playerId: data.playerId,
            votedForPlayerId: data.votedForPlayerId,
            votedForAnswerIndex: data.votedForAnswerIndex || 0,
          });
        });

        setVotes(votesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to votes:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return {
    votes,
    voteCount: votes.length,
    loading,
  };
}
