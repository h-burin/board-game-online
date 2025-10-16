/**
 * Custom Hook: usePlayers
 * จัดการ state ของผู้เล่นในห้อง
 * Listen to players sub-collection แบบ real-time จาก Firestore
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

interface UsePlayersResult {
  players: Player[];
  loading: boolean;
  error: string | null;
}

export function usePlayers(roomId: string): UsePlayersResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      setError('Room ID is required');
      return;
    }

    // Reference to players sub-collection
    const playersRef = collection(db, `rooms/${roomId}/players`);

    // Query: order by joinedAt (ascending - first joined first)
    const q = query(playersRef, orderBy('joinedAt', 'asc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData: Player[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;

          // Convert Firestore Timestamp to Date
          const player: Player = {
            id: data.id,
            name: data.name,
            avatar: data.avatar,
            isHost: data.isHost,
            isReady: data.isReady,
            isOnline: data.isOnline,
            joinedAt: data.joinedAt?.toDate() || new Date(),
          };

          playersData.push(player);
        });

        setPlayers(playersData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to players:', err);
        setError('Failed to load players');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return { players, loading, error };
}
