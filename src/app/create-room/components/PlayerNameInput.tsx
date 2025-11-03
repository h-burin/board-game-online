'use client';

interface PlayerNameInputProps {
  value: string;
  onChange: (value: string) => void;
  error: string;
  disabled?: boolean;
}

export default function PlayerNameInput({ value, onChange, error, disabled = false }: PlayerNameInputProps) {
  return (
    <div>
      <label
        htmlFor="playerName"
        className="block text-white text-base md:text-lg font-semibold mb-2"
      >
        ชื่อผู้เล่น <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        id="playerName"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ใส่ชื่อของคุณ"
        maxLength={20}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl bg-white/20 border-2 ${
          error ? "border-red-500" : "border-white/30"
        } text-white placeholder-white/50 focus:outline-none focus:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      <div className="flex justify-between mt-2">
        {error && (
          <p className="text-red-400 text-xs md:text-sm">
            {error}
          </p>
        )}
        <p className="text-white/60 text-xs md:text-sm ml-auto">
          {value.length}/20
        </p>
      </div>
    </div>
  );
}
