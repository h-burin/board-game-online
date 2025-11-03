'use client';

import { Game } from '@/types';

interface TimeLimitInputProps {
  value: number;
  onChange: (value: number) => void;
  selectedGame: Game | undefined;
  disabled?: boolean;
}

export default function TimeLimitInput({
  value,
  onChange,
  selectedGame,
  disabled = false,
}: TimeLimitInputProps) {
  // Only show if game supports custom time
  if (!selectedGame?.enableCustomTime) return null;

  return (
    <div>
      <label
        htmlFor="timeLimit"
        className="block text-white text-base md:text-lg font-semibold mb-2"
      >
        เวลาเล่น (นาที)
      </label>
      <input
        type="number"
        id="timeLimit"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={1}
        max={120}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-green-200 text-sm mt-2">
        ค่าเริ่มต้น: {selectedGame.defaultTimeMinutes || 10} นาที
        {selectedGame.defaultTimeMinutes && (
          <span className="text-white/60 ml-2">
            (ระบุ 1-120 นาที)
          </span>
        )}
      </p>
    </div>
  );
}
