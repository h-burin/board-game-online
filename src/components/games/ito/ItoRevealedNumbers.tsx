/**
 * ITO Revealed Numbers Component
 * แสดงประวัติตัวเลขที่เปิดแล้ว
 */

interface ItoRevealedNumbersProps {
  revealedNumbers: number[];
}

export default function ItoRevealedNumbers({ revealedNumbers }: ItoRevealedNumbersProps) {
  if (revealedNumbers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-green-400/30">
      <h4 className="text-white font-bold mb-3 text-center">ตัวเลขที่เปิดแล้ว</h4>
      <div className="flex flex-wrap justify-center gap-2">
        {revealedNumbers.map((num, i) => (
          <div
            key={i}
            className="bg-white/20 px-4 py-2 rounded-lg text-xl font-bold text-white"
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}
