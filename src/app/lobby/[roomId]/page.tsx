'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { useGames } from '@/lib/hooks/useGames';
import { kickPlayer, toggleReady, leaveRoom } from '@/lib/firebase/firestore';

interface LobbyPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const router = useRouter();

  // Unwrap params Promise
  const { roomId } = use(params);

  const { room, loading: roomLoading, error: roomError } = useRoom(roomId);
  const { players, loading: playersLoading, error: playersError } = usePlayers(roomId);
  const { games } = useGames();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log('🔍 Reading playerId from localStorage:', {
      roomId,
      playerId: id,
      allLocalStorage: { ...localStorage }
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect to game when room status changes to 'playing'
  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/game/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  // Check if current player was kicked (not in players list anymore)
  useEffect(() => {
    // Wait until we have players data and not loading
    if (playersLoading) {
      return;
    }

    // If we have playerId but no players at all, wait a bit more
    if (playerId && players.length === 0) {
      return;
    }

    console.log('🔍 Checking player status:', {
      playerId,
      playersCount: players.length,
      playerIds: players.map(p => p.id)
    });

    // Check if current player exists in players list
    if (playerId) {
      const playerExists = players.some(p => p.id === playerId);

      if (!playerExists && players.length > 0) {
        // Player was kicked! Redirect to join page
        console.log('⚠️ Player was kicked from room');
        alert('คุณถูกเตะออกจากห้องแล้ว');

        // Clear ALL localStorage related to this player and room
        localStorage.removeItem(`room_${roomId}_playerId`);
        localStorage.removeItem('playerId');

        // Redirect to join page after a short delay
        setTimeout(() => {
          router.push('/join-room');
        }, 2000);
        return;
      }
    }

    // If no playerId in localStorage, redirect to join page
    if (!playerId && !playersLoading) {
      console.log('⚠️ No playerId found, redirecting to join page');
      router.push('/join-room');
    }
  }, [playerId, players, playersLoading, roomId, router]);

  // Copy room code to clipboard
  const handleCopyCode = async () => {
    if (room?.code) {
      try {
        await navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Check if current user is host
  const isHost = playerId === room?.hostId;

  // Get current player
  const currentPlayer = players.find(p => p.id === playerId);

  // Get selected game details
  const selectedGame = games.find(g => g.id === room?.gameId);
  const minPlayers = selectedGame?.MinPlayer || 2;

  // Handle Kick Player
  const handleKick = async (playerIdToKick: string, playerName: string) => {
    const confirmed = confirm(`ต้องการเตะ ${playerName} ออกจากห้องหรือไม่?`);

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await kickPlayer(roomId, playerIdToKick);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      setActionError(errorMsg);
      console.error('Kick error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Ready
  const handleToggleReady = async () => {
    if (!playerId || !currentPlayer) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await toggleReady(roomId, playerId, currentPlayer.isReady);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      setActionError(errorMsg);
      console.error('Toggle ready error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    if (!playerId) return;

    const confirmed = confirm('ต้องการออกจากห้องหรือไม่?');

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await leaveRoom(roomId, playerId);
      router.push('/');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      setActionError(errorMsg);
      console.error('Leave room error:', error);
      setActionLoading(false);
    }
  };

  // Handle Start Game
  const handleStartGame = async () => {
    if (!isHost || !room || room.currentPlayers < minPlayers || !playerId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      // Call API to start game
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId: playerId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Game started:', data.gameId);
        // Redirect will happen automatically via useEffect when room status changes
      } else {
        const errorMsg = data.error || 'เกิดข้อผิดพลาดในการเริ่มเกม';
        setActionError(errorMsg);
        console.error('❌ Start game error:', data);
        setActionLoading(false);
      }
    } catch (error) {
      console.error('❌ Start game error:', error);
      setActionError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      setActionLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ห้องรอ
            </h1>

            {/* Room Code */}
            <div className="mb-6">
              <p className="text-blue-200 mb-2">รหัสห้อง</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-5xl font-bold text-white tracking-widest">
                  {room.code.slice(0, 3)}-{room.code.slice(3)}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
                  title="คัดลอกรหัสห้อง"
                >
                  {copied ? (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="text-lg text-blue-200">
              {room.currentPlayers >= 2 ? '✓ พร้อมเริ่มเกม' : 'รอผู้เล่น...'}
            </div>

            {/* Player Count */}
            <div className="text-white/70 mt-2">
              ผู้เล่น {room.currentPlayers}/{room.maxPlayers}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {actionError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-6">
            <p className="text-red-200 text-sm font-semibold">{actionError}</p>
          </div>
        )}

        {/* Players Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">ผู้เล่น</h2>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-white/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-white/20 animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  {/* Online Status */}
                  <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />

                  {/* Player Name */}
                  <span className="text-white font-semibold text-lg">{player.name}</span>

                  {/* Badges */}
                  <div className="flex gap-2">
                    {player.isHost && (
                      <span className="bg-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full text-sm font-semibold">
                        Host
                      </span>
                    )}
                    {player.isReady && (
                      <span className="bg-green-500/30 text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Kick Button (Host only, can't kick themselves) */}
                {isHost && !player.isHost && (
                  <button
                    onClick={() => handleKick(player.id, player.name)}
                    disabled={actionLoading}
                    className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="space-y-4">
            {isHost ? (
              // Host Actions
              <>
                <button
                  onClick={handleStartGame}
                  disabled={room.currentPlayers < minPlayers || actionLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none"
                >
                  {actionLoading ? 'กำลังเริ่มเกม...' : 'เริ่มเกม'}
                </button>
                {room.currentPlayers < minPlayers && (
                  <p className="text-center text-yellow-200 text-sm">
                    ต้องมีผู้เล่นอย่างน้อย {minPlayers} คน
                  </p>
                )}
              </>
            ) : (
              // Player Actions
              <button
                onClick={handleToggleReady}
                disabled={actionLoading}
                className={`w-full ${
                  currentPlayer?.isReady
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                } disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none`}
              >
                {actionLoading ? 'กำลังโหลด...' : currentPlayer?.isReady ? 'ยกเลิก Ready' : 'Ready'}
              </button>
            )}

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              disabled={actionLoading}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-200 text-lg font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'กำลังออก...' : 'ออกจากห้อง'}
            </button>
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
