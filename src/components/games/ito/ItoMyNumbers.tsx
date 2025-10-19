/**
 * ITO My Numbers Component
 * แสดงเลขของผู้เล่นตัวเอง
 */

import type { ItoPlayerAnswer } from '@/types/ito';

interface ItoMyNumbersProps {
  myAnswers: ItoPlayerAnswer[];
}

type ItoPlayerAnswerWithIndex = ItoPlayerAnswer & {
  answerIndex: number;
};

export default function ItoMyNumbers({ myAnswers }: ItoMyNumbersProps) {
  if (myAnswers.length === 0) return null;

  const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

  return (
    <div className="bg-yellow-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border-2 border-yellow-400">
      <div className="text-center">
        <p className="text-white/70 mb-2">
          {myAnswers.length === 1 ? 'เลขของคุณ:' : `เลขของคุณ (${myAnswers.length} เลข):`}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {answersWithIndex
            .sort((a, b) => a.answerIndex - b.answerIndex)
            .map((ans, idx) => (
              <div key={idx} className="text-center">
                <div className="text-6xl font-bold text-yellow-300">{ans.number}</div>
                {myAnswers.length > 1 && (
                  <div className="text-white/50 text-sm mt-1">เลขที่ {idx + 1}</div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
