"use client";

import { useState, useEffect } from "react";
import { useGames } from "@/lib/hooks/useGames";
import PlayerNameInput from "./components/PlayerNameInput";
import GameSelector from "./components/GameSelector";
import MaxPlayersSelector from "./components/MaxPlayersSelector";
import TimeLimitInput from "./components/TimeLimitInput";
import RulesModal from "./components/RulesModal";

// API Response Types
interface CreateRoomResponse {
  success: boolean;
  roomId?: string;
  code?: string;
  playerId?: string;
  error?: string;
  details?: string;
}

export default function CreateRoomPage() {
  // Load games from Firestore
  const { games, loading: gamesLoading, error: gamesError } = useGames();

  const [formData, setFormData] = useState({
    playerName: "",
    gameId: "", // Selected game ID
    maxPlayers: 4,
    timeLimit: 10, // Time limit in minutes (default 10)
  });

  const [errors, setErrors] = useState({
    playerName: "",
    gameId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Get selected game details
  const selectedGame = games.find((game) => game.id === formData.gameId);

  // Update maxPlayers and timeLimit when game changes
  useEffect(() => {
    if (selectedGame) {
      console.log("Selected game:", selectedGame);
      console.log(
        "minPlayer:",
        selectedGame.minPlayer,
        "maxPlayer:",
        selectedGame.maxPlayer,
        "defaultTimeMinutes:",
        selectedGame.defaultTimeMinutes,
        "enableCustomTime:",
        selectedGame.enableCustomTime
      );
      // Set maxPlayers to minPlayer by default when game is selected
      // Set timeLimit to game's default time (if available)
      setFormData((prev) => ({
        ...prev,
        maxPlayers: selectedGame.minPlayer,
        timeLimit: selectedGame.defaultTimeMinutes || 10,
      }));
    }
  }, [selectedGame]);

  const handlePlayerNameChange = (value: string) => {
    setFormData({ ...formData, playerName: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
    } else if (value.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
    } else {
      setErrors({ ...errors, playerName: "" });
    }
  };

  const handleGameChange = (gameId: string) => {
    setFormData({ ...formData, gameId });

    // Validation
    if (!gameId) {
      setErrors({ ...errors, gameId: "กรุณาเลือกเกม" });
    } else {
      setErrors({ ...errors, gameId: "" });
    }
  };

  const handleMaxPlayersChange = (value: number) => {
    setFormData({ ...formData, maxPlayers: value });
  };

  const handleTimeLimitChange = (value: number) => {
    setFormData({ ...formData, timeLimit: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation - Player Name
    if (!formData.playerName.trim()) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
      return;
    }

    if (formData.playerName.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
      return;
    }

    // Validation - Game
    if (!formData.gameId) {
      setErrors({ ...errors, gameId: "กรุณาเลือกเกม" });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE creating room to prevent stale data
    console.log("🗑️ Clearing all localStorage before creating room...");
    localStorage.clear();

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: formData.playerName.trim(),
          gameId: formData.gameId,
          maxPlayers: formData.maxPlayers,
          timeLimit: selectedGame?.enableCustomTime ? formData.timeLimit : undefined,
        }),
      });

      const data: CreateRoomResponse = await response.json();

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log("✅ Room created:", {
          roomId: data.roomId,
          code: data.code,
          playerId: data.playerId,
        });

        // Save NEW playerId to localStorage
        localStorage.setItem("playerId", data.playerId);
        localStorage.setItem(`room_${data.roomId}_playerId`, data.playerId);

        console.log("💾 Saved new playerId to localStorage:", data.playerId);

        // Force full page reload to ensure clean state
        window.location.href = `/lobby/${data.roomId}`;
      } else {
        // API returned error
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการสร้างห้อง";
        setApiError(errorMsg);
        console.error("❌ API Error:", data);
      }
    } catch (error) {
      // Network or parsing error
      console.error("❌ Create room error:", error);
      setApiError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-12 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              สร้างห้องเกม
            </h1>
            <p className="text-base md:text-lg text-green-200">
              เริ่มต้นเกมใหม่และเชิญเพื่อนๆ มาเล่น
            </p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-200 text-sm font-semibold">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Player Name Input */}
            <PlayerNameInput
              value={formData.playerName}
              onChange={handlePlayerNameChange}
              error={errors.playerName}
              disabled={isLoading}
            />

            {/* Game Selection Dropdown */}
            <GameSelector
              games={games}
              selectedGameId={formData.gameId}
              onChange={handleGameChange}
              onShowRules={() => setShowRulesModal(true)}
              error={errors.gameId}
              loading={gamesLoading}
              disabled={isLoading}
              gamesError={gamesError}
            />

            {/* Max Players Dropdown */}
            <MaxPlayersSelector
              value={formData.maxPlayers}
              onChange={handleMaxPlayersChange}
              selectedGame={selectedGame}
              disabled={isLoading}
            />

            {/* Time Limit Input - Show only if game supports custom time */}
            <TimeLimitInput
              value={formData.timeLimit}
              onChange={handleTimeLimitChange}
              selectedGame={selectedGame}
              disabled={isLoading}
            />

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Back Button - col-6 */}
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="w-full h-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-200 text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all"
              >
                กลับหน้าหลัก
              </button>

              {/* Submit Button - col-6 */}
              <button
                type="submit"
                disabled={
                  !!errors.playerName ||
                  !!errors.gameId ||
                  !formData.playerName.trim() ||
                  !formData.gameId ||
                  isLoading
                }
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>กำลังสร้างห้อง...</span>
                  </>
                ) : (
                  "สร้างห้อง"
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 md:mt-8 bg-green-500/20 border border-green-400/30 rounded-xl p-3 md:p-4">
            <div className="text-xs md:text-sm text-green-100 text-center">
              <span className="font-semibold">เคล็ดลับ: </span>
              หลังจากสร้างห้องแล้ว คุณจะได้รับรหัสห้อง 6 หลักเพื่อแชร์ให้เพื่อนๆ
              เข้าร่วม
            </div>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        gameName={selectedGame?.name || 'Ito'}
      />
    </div>
  );
}
