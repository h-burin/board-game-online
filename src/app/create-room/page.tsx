'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  const [formData, setFormData] = useState({
    playerName: '',
    maxPlayers: 4,
  });

  const [errors, setErrors] = useState({
    playerName: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, playerName: value });

    // Validation
    if (value.length === 0) {
      setErrors({ ...errors, playerName: 'กรุณากรอกชื่อผู้เล่น' });
    } else if (value.length > 20) {
      setErrors({ ...errors, playerName: 'ชื่อต้องไม่เกิน 20 ตัวอักษร' });
    } else {
      setErrors({ ...errors, playerName: '' });
    }
  };

  const handleMaxPlayersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, maxPlayers: parseInt(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError(null);

    // Validation
    if (!formData.playerName.trim()) {
      setErrors({ ...errors, playerName: 'กรุณากรอกชื่อผู้เล่น' });
      return;
    }

    if (formData.playerName.length > 20) {
      setErrors({ ...errors, playerName: 'ชื่อต้องไม่เกิน 20 ตัวอักษร' });
      return;
    }

    // IMPORTANT: Clear ALL localStorage BEFORE creating room to prevent stale data
    console.log('🗑️ Clearing all localStorage before creating room...');
    localStorage.clear();

    // Start loading
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: formData.playerName.trim(),
          maxPlayers: formData.maxPlayers,
        }),
      });

      const data: CreateRoomResponse = await response.json();

      if (data.success && data.roomId && data.playerId) {
        // Success!
        console.log('✅ Room created:', {
          roomId: data.roomId,
          code: data.code,
          playerId: data.playerId,
        });

        // Save NEW playerId to localStorage
        localStorage.setItem('playerId', data.playerId);
        localStorage.setItem(`room_${data.roomId}_playerId`, data.playerId);

        console.log('💾 Saved new playerId to localStorage:', data.playerId);

        // Force full page reload to ensure clean state
        window.location.href = `/lobby/${data.roomId}`;
      } else {
        // API returned error
        const errorMsg = data.error || 'เกิดข้อผิดพลาดในการสร้างห้อง';
        setApiError(errorMsg);
        console.error('❌ API Error:', data);
      }
    } catch (error) {
      // Network or parsing error
      console.error('❌ Create room error:', error);
      setApiError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-white hover:text-green-200 mb-6 transition-colors">
         
          กลับหน้าหลัก
        </Link>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              สร้างห้องเกม
            </h1>
            <p className="text-lg text-green-200">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label htmlFor="playerName" className="block text-white text-lg font-semibold mb-2">
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
                  errors.playerName ? 'border-red-500' : 'border-white/30'
                } text-white placeholder-white/50 focus:outline-none focus:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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

            {/* Max Players Dropdown */}
            <div>
              <label htmlFor="maxPlayers" className="block text-white text-lg font-semibold mb-2">
                จำนวนผู้เล่นสูงสุด
              </label>
              <select
                id="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleMaxPlayersChange}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:border-green-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num} className="bg-gray-900">
                    {num} คน
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!!errors.playerName || !formData.playerName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังสร้างห้อง...</span>
                </>
              ) : (
                'สร้างห้อง'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 bg-green-500/20 border border-green-400/30 rounded-xl p-4">
            <div className="text-sm text-green-100">
              <p className="font-semibold mb-1">เคล็ดลับ:</p>
              <p className='m-0'>หลังจากสร้างห้องแล้ว คุณจะได้รับรหัสห้อง 6 หลักเพื่อแชร์ให้เพื่อนๆ เข้าร่วม</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
