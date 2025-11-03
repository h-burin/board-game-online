'use client';

import { Game } from '@/types';

interface MaxPlayersSelectorProps {
  value: number;
  onChange: (value: number) => void;
  selectedGame: Game | undefined;
  disabled?: boolean;
}

export default function MaxPlayersSelector({
  value,
  onChange,
  selectedGame,
  disabled = false,
}: MaxPlayersSelectorProps) {
  return (
    <div>
      <label
        htmlFor="maxPlayers"
        className="block text-white text-base md:text-lg font-semibold mb-2"
      >
        จำนวนผู้เล่นสูงสุด
      </label>
      <select
        id="maxPlayers"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled || !selectedGame}
        className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white focus:outline-none focus:border-green-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedGame ? (
          // Generate options based on selected game's minPlayer - maxPlayer
          Array.from(
            {
              length:
                selectedGame.maxPlayer - selectedGame.minPlayer + 1,
            },
            (_, i) => selectedGame.minPlayer + i
          ).map((num) => (
            <option key={num} value={num} className="bg-gray-900">
              {num} คน
            </option>
          ))
        ) : (
          <option value={4} className="bg-gray-900">
            กรุณาเลือกเกมก่อน
          </option>
        )}
      </select>
      {selectedGame && (
        <p className="text-green-200 text-sm mt-2">
          เกมนี้รองรับ {selectedGame.minPlayer}-{selectedGame.maxPlayer}{" "}
          คน
          {selectedGame.maxPlayer > 20 && (
            <span className="text-yellow-300 ml-2">
              (⚠️ จำนวนผู้เล่นสูงมาก โปรดตรวจสอบข้อมูลเกม)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
