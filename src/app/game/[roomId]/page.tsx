/**
 * หน้าเล่นเกม
 * แสดงเกมที่เลือกและจัดการ gameplay
 * Dynamic route: /game/[roomId]
 */

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import ItoGame from "@/components/games/ItoGame";

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
  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = usePlayers(roomId);
  const { games } = useGames();

  const [playerId, setPlayerId] = useState<string | null>(null);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log("🎮 Game page - Reading playerId from localStorage:", {
      roomId,
      playerId: id,
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect back to lobby if game is not in 'playing' status
  useEffect(() => {
    if (room && room.status !== "playing") {
      console.log("⚠️ Game not started yet, redirecting to lobby");
      router.push(`/lobby/${roomId}`);
    }
  }, [room, roomId, router]);

  // Check if player is still in the room
  useEffect(() => {
    if (!playersLoading && playerId) {
      const playerExists = players.some((p) => p.id === playerId);

      if (!playerExists && players.length > 0) {
        console.log("⚠️ Player not found in room");
        alert("คุณไม่อยู่ในห้องนี้แล้ว");
        localStorage.removeItem(`room_${roomId}_playerId`);
        router.push("/");
      }
    }
  }, [playerId, players, playersLoading, roomId, router]);

  // Get selected game details
  const selectedGame = games.find((g) => g.id === room?.gameId);

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
          <p className="text-red-300 mb-6">
            {roomError || playersError || "ไม่พบห้อง"}
          </p>
          <Link href="/" className="text-blue-300 hover:text-blue-200">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // Get current player (for future use)
  // const currentPlayer = players.find(p => p.id === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-3 md:p-4">
      <div className="max-w-6xl mx-auto py-3 md:py-8">
        {/* Combined Game Header + Players List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 mb-3 md:mb-6 border border-white/20">
          {/* Game Header Section */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border border-blue-400/30">
            <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
              {/* Game Name */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-white">
                  {selectedGame?.name || room.gameType || "เกม"}
                </h1>
                <div className="flex flex-row items-center gap-2">
                  <p className="text-xs md:text-base text-blue-200">
                    รหัสห้อง:
                  </p>
                  <span className="font-bold text-yellow-200 text-base md:text-lg tracking-wider">
                    {room.code.slice(0, 3)}-{room.code.slice(3)}
                  </span>
                </div>
              </div>

              {/* Right Side: Status + Home Button */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Status Badge */}
                <div className="bg-green-500/30 border-green-400/50 rounded-xl px-3 md:px-4 py-2 border backdrop-blur-sm">
                  <div className="text-xs md:text-sm text-white/80 font-semibold text-center whitespace-nowrap flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse block" />
                    กำลังเล่น
                  </div>
                </div>

                {/* Home Button */}
                <Link
                  href="/"
                  className="group bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl px-3 md:px-4 py-2 backdrop-blur-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-xs md:text-sm text-white font-semibold hidden sm:inline">
                      กลับหน้าหลัก
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base md:text-xl font-bold text-white">
                ผู้เล่นทั้งหมด
              </h2>
              <span className="text-sm md:text-base text-white/70 font-semibold">
                {players.length}
                {selectedGame && (
                  <span className="text-xs md:text-base">
                    /{selectedGame.maxPlayer}
                  </span>
                )}{" "}
                คน
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`bg-white/5 rounded-lg px-3 py-2 border transition-all hover:bg-white/10 ${
                    player.id === playerId
                      ? "border-yellow-400/50 bg-yellow-500/10"
                      : "border-white/10"
                  } animate-fadeIn`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-2">
                    {/* Player Number */}
                    <div className="text-base font-bold text-white/40">
                      #{index + 1}
                    </div>

                    {/* Player Name */}
                    <div className="text-sm font-bold text-white">
                      {player.name}
                    </div>

                    {/* Badges */}
                    {player.isHost && (
                      <span className="bg-yellow-500/30 text-yellow-200 px-1.5 py-0.5 rounded text-xs font-semibold">
                        Host
                      </span>
                    )}
                    {player.id === playerId && (
                      <span className="bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded text-xs font-semibold">
                        คุณ
                      </span>
                    )}

                    {/* Online Status */}
                    <div className="flex-shrink-0">
                      {player.isOnline ? (
                        <div className="w-2 h-2 rounded-full bg-green-400" title="Online" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-500" title="Offline" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Content */}
        {room.gameId === "BWLxJkh45e6RiALRBmcl" &&
        playerId &&
        room.gameSessionId ? (
          <ItoGame sessionId={room.gameSessionId} playerId={playerId} />
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mt-6 border border-white/20">
            <div className="text-center text-white/50">
              <p className="text-xl mb-4">🎮 Game Content</p>
              <p className="text-sm">เกมนี้ยังไม่รองรับ</p>
            </div>
          </div>
        )}
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
