"use client";

import { useState } from "react";
import Link from "next/link";

// API Response Types
interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  code?: string;
  playerId?: string;
  error?: string;
  details?: string;
}

export default function JoinRoomPage() {
  const [formData, setFormData] = useState({
    roomCode: "",
    playerName: "",
  });

  const [errors, setErrors] = useState({
    roomCode: "",
    playerName: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove non-digit characters
    value = value.replace(/\D/g, "");

    // Limit to 6 digits
    value = value.slice(0, 6);

    setFormData({ ...formData, roomCode: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, roomCode: "กรุณากรอกรหัสห้อง" });
    } else if (value.length < 6) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
    } else {
      setErrors({ ...errors, roomCode: "" });
    }
  };

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation
    if (formData.roomCode.length !== 6) {
      setErrors({ ...errors, roomCode: "รหัสห้องต้องเป็นตัวเลข 6 หลัก" });
      return;
    }

    if (!formData.playerName.trim()) {
      setErrors({ ...errors, playerName: "กรุณากรอกชื่อผู้เล่น" });
      return;
    }

    if (formData.playerName.length > 20) {
      setErrors({ ...errors, playerName: "ชื่อต้องไม่เกิน 20 ตัวอักษร" });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE joining to prevent stale data
    console.log("🗑️ Clearing all localStorage before joining...");
    localStorage.clear();

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.roomCode,
          playerName: formData.playerName.trim(),
        }),
      });

      const data: JoinRoomResponse = await response.json();

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log("✅ Joined room:", {
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
        const errorMsg = data.error || "เกิดข้อผิดพลาดในการเข้าร่วมห้อง";
        setApiError(errorMsg);
        console.error("❌ API Error:", data);
      }
    } catch (error) {
      // Network or parsing error
      console.error("❌ Join room error:", error);
      setApiError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Format room code as XXX-XXX
  const formatRoomCode = (code: string) => {
    if (code.length <= 3) return code;
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  const isFormValid =
    formData.roomCode.length === 6 &&
    formData.playerName.trim().length > 0 &&
    !errors.roomCode &&
    !errors.playerName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              เข้าร่วมห้อง
            </h1>
            <p className="text-lg text-blue-200">ใส่รหัสห้องเพื่อเข้าร่วมเกม</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-200 text-sm font-semibold">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Code Input */}
            <div>
              <label
                htmlFor="roomCode"
                className="block text-white text-lg font-semibold mb-3 text-center"
              >
                รหัสห้อง <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="roomCode"
                value={formatRoomCode(formData.roomCode)}
                onChange={handleRoomCodeChange}
                placeholder="000-000"
                inputMode="numeric"
                disabled={isLoading}
                className={`w-full px-6 py-6 rounded-2xl bg-white/20 border-2 ${
                  errors.roomCode ? "border-red-500" : "border-white/30"
                } text-white text-center text-4xl font-bold placeholder-white/30 focus:outline-none focus:border-blue-400 transition-colors tracking-widest disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <div className="mt-3 text-center">
                {errors.roomCode && (
                  <p className="text-red-400 text-sm">{errors.roomCode}</p>
                )}
              </div>
            </div>

            {/* Player Name Input */}
            <div>
              <label
                htmlFor="playerName"
                className="block text-white text-lg font-semibold mb-2"
              >
                ชื่อผู้เล่น <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="playerName"
                value={formData.playerName}
                onChange={handlePlayerNameChange}
                placeholder="ใส่ชื่อของคุณ"
                maxLength={20}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl bg-white/20 border-2 ${
                  errors.playerName ? "border-red-500" : "border-white/30"
                } text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <div className="flex justify-between mt-2">
                {errors.playerName && (
                  <p className="text-red-400 text-sm">{errors.playerName}</p>
                )}
                <p className="text-white/60 text-sm ml-auto">
                  {formData.playerName.length}/20
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Submit Button - col-6 */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
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
                    <span>กำลังเข้าห้อง...</span>
                  </>
                ) : (
                  "เข้าห้อง"
                )}
              </button>

              {/* Back Button - col-6 */}
              <Link href="/" className="block w-full">
                <button
                  type="button"
                  className="w-full h-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-200 text-xl font-bold py-4 rounded-xl transition-all"
                >
                  กลับหน้าหลัก
                </button>
              </Link>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
            <div className="text-sm text-blue-100 text-center">
              <span className="font-semibold mb-1">คำแนะนำ:</span>{" "}
              รหัสห้องเป็นตัวเลข 6 หลักที่ได้รับจากผู้สร้างห้อง
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
