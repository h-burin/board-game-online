/**
 * ITO Writing Phase Component
 * ช่วงพิมพ์คำใบ้
 */

import { useState } from 'react';
import type { ItoPlayerAnswer, ItoGameState } from '@/types/ito';
import ItoRevealedNumbers from './ItoRevealedNumbers';

interface ItoWritingPhaseProps {
  gameState: ItoGameState;
  myAnswers: ItoPlayerAnswer[];
  onSubmitAnswer: (answerIndex: number, answer: string) => Promise<void>;
  submitting: boolean;
}

type ItoPlayerAnswerWithIndex = ItoPlayerAnswer & {
  answerIndex: number;
};

export default function ItoWritingPhase({
  gameState,
  myAnswers,
  onSubmitAnswer,
  submitting,
}: ItoWritingPhaseProps) {
  const [answers, setAnswers] = useState<{ [answerIndex: number]: string }>({});

  const answersWithIndex = myAnswers as unknown as ItoPlayerAnswerWithIndex[];

  // Auto-fill submitted answers
  useState(() => {
    const newAnswers: { [key: number]: string } = {};
    answersWithIndex.forEach((ans) => {
      if (ans.submittedAt) {
        newAnswers[ans.answerIndex] = ans.answer || '';
      }
    });
    setAnswers(newAnswers);
  });

  const handleSubmit = async (answerIndex: number) => {
    const answer = answers[answerIndex];
    if (!answer?.trim()) return;
    await onSubmitAnswer(answerIndex, answer.trim());
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
      <h3 className="text-2xl font-bold text-white mb-4">พิมพ์คำใบ้ของคุณ</h3>
      <p className="text-white/70 mb-6">
        ให้คำใบ้ที่สื่อถึงตัวเลขของคุณ โดยไม่ต้องบอกตัวเลข
      </p>

      {/* ประวัติเลขที่เปิดแล้ว */}
      <ItoRevealedNumbers revealedNumbers={gameState.revealedNumbers} />

      {/* แสดงช่องกรอกแยกสำหรับแต่ละเลข */}
      <div className="space-y-6">
        {answersWithIndex
          .sort((a, b) => a.answerIndex - b.answerIndex)
          .map((ans) => {
            const isSubmitted = !!ans.submittedAt;
            return (
              <div key={ans.answerIndex} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                {/* เลขที่ */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white/70">
                    {myAnswers.length > 1 ? `เลขที่ ${ans.answerIndex + 1}:` : 'เลขของคุณ:'}
                  </div>
                  <div className="text-3xl font-bold text-yellow-300">{ans.number}</div>
                </div>

                {/* ช่องกรอกคำใบ้ */}
                <textarea
                  className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/20 focus:border-white/50 focus:outline-none resize-none"
                  rows={3}
                  placeholder={`พิมพ์คำใบ้สำหรับเลข ${ans.number}...`}
                  value={answers[ans.answerIndex] || ''}
                  onChange={(e) => setAnswers({ ...answers, [ans.answerIndex]: e.target.value })}
                  disabled={isSubmitted}
                />

                {/* ปุ่มส่ง */}
                {!isSubmitted ? (
                  <button
                    onClick={() => handleSubmit(ans.answerIndex)}
                    disabled={!answers[ans.answerIndex]?.trim() || submitting}
                    className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                  >
                    {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                  </button>
                ) : (
                  <div className="mt-3 text-center text-green-400 font-bold">
                    ✓ ส่งคำตอบแล้ว
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* แสดงสถานะรวม */}
      {answersWithIndex.every((ans) => ans.submittedAt) && (
        <div className="mt-6 text-center text-green-400 font-bold text-lg">
          ✓ ส่งคำตอบครบทุกเลขแล้ว รอผู้เล่นคนอื่น...
        </div>
      )}
    </div>
  );
}
