/**
 * ITO Question Card Component
 * แสดงโจทย์ของเกม
 */

interface ItoQuestionCardProps {
  questionText: string;
}

export default function ItoQuestionCard({ questionText }: ItoQuestionCardProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
      <h3 className="text-lg text-white/70 mb-2">โจทย์:</h3>
      <p className="text-3xl font-bold text-white">{questionText}</p>
    </div>
  );
}
