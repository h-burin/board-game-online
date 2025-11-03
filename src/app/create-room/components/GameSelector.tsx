'use client';

import { Game } from '@/types';

interface GameSelectorProps {
  games: Game[];
  selectedGameId: string;
  onChange: (gameId: string) => void;
  onShowRules: () => void;
  error: string;
  loading?: boolean;
  disabled?: boolean;
  gamesError?: string | null;
}

export default function GameSelector({
  games,
  selectedGameId,
  onChange,
  onShowRules,
  error,
  loading = false,
  disabled = false,
  gamesError = null,
}: GameSelectorProps) {
  const selectedGame = games.find((game) => game.id === selectedGameId);
  const isItoGame = selectedGame?.id === 'BWLxJkh45e6RiALRBmcl';

  return (
    <div>
      <label
        htmlFor="gameId"
        className="block text-white text-base md:text-lg font-semibold mb-2"
      >
        เลือกเกม <span className="text-red-400">*</span>
      </label>
      {loading ? (
        <div className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white/50 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 mr-2"
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
          กำลังโหลดรายการเกม...
        </div>
      ) : gamesError ? (
        <div className="w-full px-4 py-3 rounded-xl bg-red-500/20 border-2 border-red-500/50 text-red-200">
          {gamesError}
        </div>
      ) : (
        <select
          id="gameId"
          value={selectedGameId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || games.length === 0}
          className={`w-full px-4 py-3 rounded-xl bg-white/20 border-2 ${
            error ? "border-red-500" : "border-white/30"
          } text-white focus:outline-none focus:border-green-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" className="bg-gray-900">
            -- เลือกเกม --
          </option>
          {games.map((game) => (
            <option
              key={game.id}
              value={game.id}
              className="bg-gray-900"
            >
              {game.name} ({game.minPlayer}-{game.maxPlayer} คน)
            </option>
          ))}
        </select>
      )}
      {error && (
        <p className="text-red-400 text-xs md:text-sm mt-2">
          {error}
        </p>
      )}

      {/* Rules Button - Show only for Ito game */}
      {isItoGame && (
        <button
          type="button"
          onClick={onShowRules}
          className="mt-3 w-full px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/50 text-blue-100 font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          กติกาการเล่น
        </button>
      )}
    </div>
  );
}
