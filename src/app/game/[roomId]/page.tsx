/**
 * หน้าเล่นเกม
 * แสดงเกมที่เลือกและจัดการ gameplay
 * Dynamic route: /game/[roomId]
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { useGames } from '@/lib/hooks/useGames';

interface GamePageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();

  // Unwrap params Promise
  const { roomId } = use(params);

  const { room, loading: roomLoading, error: roomError } = useRoom(roomId);
  const { players, loading: playersLoading, error: playersError } = usePlayers(roomId);
  const { games } = useGames();

  const [playerId, setPlayerId] = useState<string | null>(null);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log('🎮 Game page - Reading playerId from localStorage:', {
      roomId,
      playerId: id,
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect back to lobby if game is not in 'playing' status
  useEffect(() => {
    if (room && room.status !== 'playing') {
      console.log('⚠️ Game not started yet, redirecting to lobby');
      router.push(`/lobby/${roomId}`);
    }
  }, [room, roomId, router]);

  // Check if player is still in the room
  useEffect(() => {
    if (!playersLoading && playerId) {
      const playerExists = players.some(p => p.id === playerId);

      if (!playerExists && players.length > 0) {
        console.log('⚠️ Player not found in room');
        alert('คุณไม่อยู่ในห้องนี้แล้ว');
        localStorage.removeItem(`room_${roomId}_playerId`);
        router.push('/');
      }
    }
  }, [playerId, players, playersLoading, roomId, router]);

  // Get selected game details
  const selectedGame = games.find(g => g.id === room?.gameId);

  // Loading state
  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  // Error state
  if (roomError || playersError || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-red-300 mb-6">{roomError || playersError || 'ไม่พบห้อง'}</p>
          <Link href="/" className="text-blue-300 hover:text-blue-200">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // Get current player
  const currentPlayer = players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Game Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {selectedGame?.name || room.gameType || 'เกม'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-blue-200">
              <div>
                รหัสห้อง: <span className="font-bold text-white">{room.code.slice(0, 3)}-{room.code.slice(3)}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>กำลังเล่น</div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">ผู้เล่นทั้งหมด</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`bg-white/10 rounded-2xl p-6 border-2 transition-all hover:scale-105 ${
                  player.id === playerId
                    ? 'border-yellow-400 bg-yellow-500/20'
                    : 'border-white/20'
                } animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  {/* Player Number */}
                  <div className="text-5xl font-bold text-white/30 mb-2">
                    #{index + 1}
                  </div>

                  {/* Player Name */}
                  <div className="text-xl font-bold text-white mb-3">
                    {player.name}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {player.isHost && (
                      <span className="bg-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">
                        Host
                      </span>
                    )}
                    {player.id === playerId && (
                      <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                        คุณ
                      </span>
                    )}
                    {player.isOnline ? (
                      <span className="bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        Online
                      </span>
                    ) : (
                      <span className="bg-gray-500/30 text-gray-200 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Player Count Summary */}
          <div className="mt-8 text-center text-white/70 text-lg">
            จำนวนผู้เล่น: <span className="font-bold text-white">{players.length}</span> คน
            {selectedGame && (
              <span className="ml-4">
                ({selectedGame.MinPlayer}-{selectedGame.MaxPlayer} คน)
              </span>
            )}
          </div>
        </div>

        {/* Placeholder for game content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mt-6 border border-white/20">
          <div className="text-center text-white/50">
            <p className="text-xl mb-4">🎮 Game Content</p>
            <p className="text-sm">เนื้อหาเกมจะแสดงที่นี่</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
