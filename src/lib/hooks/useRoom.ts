/**
 * Custom Hook: useRoom
 * จัดการ state และ logic ของห้อง
 * Listen to room document แบบ real-time จาก Firestore
 */

'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Room } from '@/types';

interface UseRoomResult {
  room: Room | null;
  loading: boolean;
  error: string | null;
}

export function useRoom(roomId: string): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      setError('Room ID is required');
      return;
    }

    // Reference to room document
    const roomRef = doc(db, 'rooms', roomId);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DocumentData;

          // Convert Firestore Timestamps to Dates
          const roomData: Room = {
            id: data.id,
            code: data.code,
            gameId: data.gameId || '', // Game ID (required)
            gameType: data.gameType, // Game name for display
            gameSessionId: data.gameSessionId, // Game session ID
            hostId: data.hostId,
            status: data.status,
            maxPlayers: data.maxPlayers,
            currentPlayers: data.currentPlayers,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };

          setRoom(roomData);
          setError(null);
        } else {
          setRoom(null);
          setError('Room not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to room:', err);
        setError('Failed to load room data');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return { room, loading, error };
}
