"use client";

import { use, useEffect, useState } from "react";
import { LuPencil , LuCheck , LuX} from "react-icons/lu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRoom } from "@/lib/hooks/useRoom";
import { usePlayers } from "@/lib/hooks/usePlayers";
import { useGames } from "@/lib/hooks/useGames";
import { kickPlayer, toggleReady, leaveRoom } from "@/lib/firebase/firestore";

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
  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = usePlayers(roomId);
  const { games } = useGames();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingMaxPlayers, setEditingMaxPlayers] = useState(false);
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(0);

  // Get playerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem(`room_${roomId}_playerId`);
    console.log("🔍 Reading playerId from localStorage:", {
      roomId,
      playerId: id,
      allLocalStorage: { ...localStorage },
    });
    setPlayerId(id);
  }, [roomId]);

  // Redirect to game when room status changes to 'playing'
  useEffect(() => {
    if (room?.status === "playing") {
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

    console.log("🔍 Checking player status:", {
      playerId,
      playersCount: players.length,
      playerIds: players.map((p) => p.id),
    });

    // Check if current player exists in players list
    if (playerId) {
      const playerExists = players.some((p) => p.id === playerId);

      if (!playerExists && players.length > 0) {
        // Player was kicked! Redirect to join page
        console.log("⚠️ Player was kicked from room");
        alert("คุณถูกเตะออกจากห้องแล้ว");

        // Clear ALL localStorage related to this player and room
        localStorage.removeItem(`room_${roomId}_playerId`);
        localStorage.removeItem("playerId");

        // Redirect to join page after a short delay
        setTimeout(() => {
          router.push("/join-room");
        }, 2000);
        return;
      }
    }

    // If no playerId in localStorage, redirect to join page
    if (!playerId && !playersLoading) {
      console.log("⚠️ No playerId found, redirecting to join page");
      router.push("/join-room");
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
        console.error("Failed to copy:", err);
      }
    }
  };

  // Check if current user is host
  const isHost = playerId === room?.hostId;

  // Get current player
  const currentPlayer = players.find((p) => p.id === playerId);

  // Get selected game details
  const selectedGame = games.find((g) => g.id === room?.gameId);
  const minPlayers = selectedGame?.minPlayer || 2;

  // Check if all players are ready (except host)
  const allPlayersReady = players.every(
    (player) => player.isReady === true || player.isHost === true
  );

  // Check if game can start
  const canStartGame =
    room && room.currentPlayers >= minPlayers && allPlayersReady;

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
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Kick error:", error);
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
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Toggle ready error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = async () => {
    if (!playerId) return;

    const confirmed = confirm("ต้องการออกจากห้องหรือไม่?");

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await leaveRoom(roomId, playerId);
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setActionError(errorMsg);
      console.error("Leave room error:", error);
      setActionLoading(false);
    }
  };

  // Handle Update Max Players
  const handleUpdateMaxPlayers = async () => {
    if (!isHost || !playerId || !room) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}/update-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: playerId,
          maxPlayers: newMaxPlayers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingMaxPlayers(false);
      } else {
        setActionError(data.error || "ไม่สามารถอัพเดทการตั้งค่าได้");
      }
    } catch (error) {
      console.error("Update settings error:", error);
      setActionError("เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Start Game
  const handleStartGame = async () => {
    if (!isHost || !room || !canStartGame || !playerId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      // Call API to start game
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId: playerId,
        }),
      });

      const data = await response.json();

      console.log("API Response:", { status: response.status, data });

      if (data.success) {
        console.log("✅ Game started:", data.gameSessionId);
        // Redirect will happen automatically via useEffect when room status changes
      } else {
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการเริ่มเกม";
        setActionError(errorMsg);
        console.error("❌ Start game error:", {
          status: response.status,
          data,
        });
        setActionLoading(false);
      }
    } catch (error) {
      console.error("❌ Start game error:", error);
      setActionError(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง"
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Combined Header + Players Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-4 md:p-8 mb-4 md:mb-6 border border-white/20">
          {/* Game Name & Room Code Header */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 border border-blue-400/30">
            <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
              {/* Game Name */}
              <div className="text-left w-full md:w-auto">
                <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
                  {selectedGame?.name || "เกม"}
                </h1>
                <div className="flex flex-col items-start ">
                  <p className="text-xs md:text-base text-blue-200">
                    รหัสห้อง:
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-bold text-yellow-200 text-2xl  tracking-wider">
                      {room.code.slice(0, 3)}-{room.code.slice(3)}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="bg-white/20 hover:bg-white/30 active:scale-95 p-1.5 md:p-2 rounded-lg transition-all"
                      title="คัดลอกรหัสห้อง"
                    >
                      {copied ? (
                        <svg
                          className="w-5 h-5 md:w-5 md:h-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 md:w-5 md:h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {actionError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
              <p className="text-red-200 text-xs md:text-sm font-semibold">
                {actionError}
              </p>
            </div>
          )}

          {/* Players Title */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-xl font-bold text-white">
              ผู้เล่นทั้งหมด
            </h2>

            {/* Max Players - Editable by Host */}
            {isHost ? (
              <div className="flex items-center gap-2">
                {editingMaxPlayers ? (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
                    <span className="text-white/70 text-sm">{room.currentPlayers}/</span>
                    <input
                      type="number"
                      min={room.currentPlayers}
                      max={selectedGame?.maxPlayer || 10}
                      value={newMaxPlayers}
                      onChange={(e) =>
                        setNewMaxPlayers(parseInt(e.target.value))
                      }
                      className="w-12 bg-white/20 text-white text-center rounded px-1 py-0.5 text-sm font-semibold border border-white/30 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                    <span className="text-white/70 text-sm">คน</span>
                    <div className="flex gap-1 ml-1">
                      <button
                        onClick={handleUpdateMaxPlayers}
                        disabled={
                          actionLoading || newMaxPlayers < room.currentPlayers || newMaxPlayers > (selectedGame?.maxPlayer || 10)
                        }
                        className="p-1.5 rounded bg-green-500/30 hover:bg-green-500/50 text-green-300 hover:text-green-200 border border-green-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="บันทึก"
                      >
                        <LuCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMaxPlayers(false)}
                        disabled={actionLoading}
                        className="p-1.5 rounded bg-red-500/30 hover:bg-red-500/50 text-red-300 hover:text-red-200 border border-red-500/40 transition-all"
                        title="ยกเลิก"
                      >
                        <LuX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-all group">
                    <span className="text-sm md:text-base text-white/70 font-semibold">
                      {room.currentPlayers}/{room.maxPlayers} คน
                    </span>
                    <button
                      onClick={() => {
                        setNewMaxPlayers(room.maxPlayers);
                        setEditingMaxPlayers(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20 text-white/60 hover:text-white"
                      title="แก้ไขจำนวนผู้เล่น"
                    >
                      <LuPencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg px-3 py-1.5">
                <span className="text-sm md:text-base text-white/70 font-semibold">
                  {room.currentPlayers}/{room.maxPlayers} คน
                </span>
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 transition-all hover:bg-white/20 animate-fadeIn border border-white/5"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
                <div className="flex flex-row md:items-center justify-between gap-2 md:gap-4">
                  {/* Top Row (Mobile) / Left Side (Desktop): Number Badge + Name + Online Status */}
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    {/* Player Number Badge */}
                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 flex items-center justify-center flex-shrink-0 border border-white/20">
                      <span className="text-white font-bold text-sm md:text-lg">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Player Name */}
                    <span className="text-white font-semibold text-sm md:text-lg truncate flex-1">
                      {player.name}
                    </span>

                    {/* Online Status (visible on mobile) */}
                    <div
                      className={`w-2 h-2 md:hidden rounded-full flex-shrink-0 ${
                        player.isOnline
                          ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>

                  {/* Bottom Row (Mobile) / Right Side (Desktop): Badges + Online Status + Kick Button */}
                  <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {player.isHost && (
                        <span className="bg-yellow-500/30 text-yellow-200 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold border border-yellow-400/30">
                          Host
                        </span>
                      )}
                      {player.isReady && !player.isHost && (
                        <span className="bg-green-500/30 text-green-200 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold border border-green-400/30">
                          พร้อม
                        </span>
                      )}
                    </div>

                    {/* Right Side Group: Online Status (desktop) + Kick Button */}
                    <div className="flex items-center gap-2 md:gap-3">
                      {/* Online Status (visible on desktop) */}
                      <div
                        className={`hidden md:block w-3 h-3 rounded-full flex-shrink-0 ${
                          player.isOnline
                            ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                            : "bg-gray-500"
                        }`}
                      />

                      {/* Kick Button (Host only, can't kick themselves) */}
                      {isHost && !player.isHost && (
                        <button
                          onClick={() => handleKick(player.id, player.name)}
                          disabled={actionLoading}
                          className="bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs md:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 px-2.5 md:px-4 py-1 md:py-2 rounded-lg shadow-sm hover:shadow-md active:scale-95"
                        >
                          เตะ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
          <div className="space-y-3 md:space-y-4">
            {isHost ? (
              // Host Actions
              <>
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame || actionLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none"
                >
                  {actionLoading ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
                </button>
                {!canStartGame && (
                  <p className="text-center text-yellow-200 text-xs md:text-sm">
                    {room.currentPlayers < minPlayers
                      ? `ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คน`
                      : "ผู้เล่นทุกคนต้องกด พร้อม ก่อน"}
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
                    ? "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                } disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none`}
              >
                {actionLoading
                  ? "กำลังโหลด..."
                  : currentPlayer?.isReady
                  ? "ยกเลิกความพร้อม"
                  : "พร้อมแล้ว"}
              </button>
            )}

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              disabled={actionLoading}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-200 text-base md:text-lg font-bold py-2.5 md:py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? "กำลังออก..." : "ออกจากห้อง"}
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
