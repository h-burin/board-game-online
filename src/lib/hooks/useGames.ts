/**
 * Custom Hook: useGames
 * ดึงรายการเกมทั้งหมดจาก games collection
 * Listen แบบ real-time จาก Firestore
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Game } from '@/types';

interface UseGamesResult {
  games: Game[];
  loading: boolean;
  error: string | null;
}

export function useGames(): UseGamesResult {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reference to games collection
    const gamesRef = collection(db, 'games');

    // Query: order by name (ascending)
    const q = query(gamesRef, orderBy('name', 'asc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gamesData: Game[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;

          // Convert Firestore data to Game type
          const game: Game = {
            id: doc.id,
            name: data.name || 'ไม่มีชื่อเกม',
            minPlayer: data.minPlayer || 2,
            maxPlayer: data.maxPlayer || 8,
            description: data.description,
            imageUrl: data.imageUrl,
            defaultTimeMinutes: data.defaultTimeMinutes,
            enableCustomTime: data.enableCustomTime,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };

          gamesData.push(game);
        });

        setGames(gamesData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to games:', err);
        setError('ไม่สามารถโหลดรายการเกมได้');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return { games, loading, error };
}
