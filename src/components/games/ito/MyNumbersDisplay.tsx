/**
 * My Numbers Display Component
 * แสดงเลขของผู้เล่น
 */

"use client";

type ItoPlayerAnswerWithIndex = {
  playerId: string;
  playerName: string;
  number: number;
  answer: string;
  submittedAt?: Date;
  isRevealed: boolean;
  answerIndex: number;
};

interface MyNumbersDisplayProps {
  myAnswers: ItoPlayerAnswerWithIndex[];
}

export default function MyNumbersDisplay({
  myAnswers,
}: MyNumbersDisplayProps) {
  if (myAnswers.length === 0) return null;

  return (
    <div className="bg-yellow-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border-2 border-yellow-400">
      <div className="text-center">
        <p className="text-white/70 mb-2">
          {myAnswers.length === 1
            ? "เลขของคุณ:"
            : `เลขของคุณ (${myAnswers.length} เลข):`}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {myAnswers
            .sort((a, b) => a.answerIndex - b.answerIndex)
            .map((ans, idx) => (
              <div key={idx} className="text-center">
                <div className="text-6xl font-bold text-yellow-300">
                  {ans.number}
                </div>
                {myAnswers.length > 1 && (
                  <div className="text-white/50 text-sm mt-1">
                    เลขที่ {idx + 1}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
