/**
 * Custom Hook: useReadyStatus
 * Real-time updates สำหรับสถานะ "พร้อม" ของผู้เล่นในหน้า levelComplete
 */

import { useEffect, useState } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ItoReadyStatus } from '@/types/ito';

interface UseReadyStatusResult {
  readyPlayers: ItoReadyStatus[];
  readyCount: number;
  loading: boolean;
}

export function useReadyStatus(sessionId: string): UseReadyStatusResult {
  const [readyPlayers, setReadyPlayers] = useState<ItoReadyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const readyRef = collection(db, `game_sessions/${sessionId}/ready_status`);

    const unsubscribe = onSnapshot(
      readyRef,
      (snapshot) => {
        const players: ItoReadyStatus[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          players.push({
            playerId: data.playerId,
            playerName: data.playerName,
            readyAt: data.readyAt ? (data.readyAt as Timestamp).toDate() : new Date(),
          });
        });

        setReadyPlayers(players);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to ready status:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  return {
    readyPlayers,
    readyCount: readyPlayers.length,
    loading,
  };
}
