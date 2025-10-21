/**
 * Revealed Numbers List Component
 * แสดงรายการเลขที่เปิดแล้ว
 */

"use client";

interface RevealedNumbersListProps {
  revealedNumbers: number[];
}

export default function RevealedNumbersList({
  revealedNumbers,
}: RevealedNumbersListProps) {
  if (revealedNumbers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-green-400/30">
      <h4 className="text-white font-bold mb-2 md:mb-3 text-center text-sm md:text-base">
        ตัวเลขที่เปิดแล้ว
      </h4>
      <div className="flex flex-wrap justify-center gap-2">
        {revealedNumbers.map((num, i) => (
          <div
            key={i}
            className="bg-white/20 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-lg md:text-xl font-bold text-white"
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}
