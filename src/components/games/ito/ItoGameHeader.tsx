/**
 * ITO Game Header Component
 * แสดงข้อมูลหัวเกม: ชื่อ, จำนวนเลขที่เปิด, หัวใจ, เวลา
 */

import type { ItoGameState } from '@/types/ito';

interface ItoGameHeaderProps {
  gameState: ItoGameState;
  timeLeft: number;
}

export default function ItoGameHeader({ gameState, timeLeft }: ItoGameHeaderProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">เกมความสามัคคี</h2>
          <p className="text-blue-200">เปิดแล้ว {gameState.revealedNumbers.length}/{gameState.totalRounds} เลข</p>
        </div>

        {/* Hearts */}
        <div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`text-4xl transition-all duration-500 ${
                  i < gameState.hearts ? 'text-red-500 scale-100' : 'text-gray-600 opacity-30 scale-75'
                }`}
              >
                ❤️
              </div>
            ))}
          </div>
          <div className="text-center text-white/70 text-sm mt-1">
            {gameState.hearts} / 3
          </div>
        </div>
      </div>

      {/* Timer */}
      {gameState.phase !== 'finished' && gameState.phaseEndTime && (
        <div className="mt-4 text-center">
          <div className="text-4xl font-bold text-yellow-300">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-white/70 mt-1">
            {gameState.phase === 'writing' ? 'เวลาพิมพ์คำใบ้' : 'เวลาโหวต'}
          </div>
        </div>
      )}
    </div>
  );
}
