import { ItoGameLog } from "@/lib/hooks/useItoGameLogs";

interface LogCardsProps {
  logs: ItoGameLog[];
  questions: { [key: string]: string };
  onEdit: (logId: string, currentAnswer: string) => void;
  onDelete: (logId: string, answer: string) => void;
}

export function LogCards({
  logs,
  questions,
  onEdit,
  onDelete,
}: LogCardsProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="md:hidden space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                {formatDate(log.createdAt)}
              </div>
              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                {questions[log.questionId] || log.questionId}
              </div>
            </div>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {log.number}
            </span>
          </div>

          {/* Answer */}
          <div className="mb-3">
            <div className="text-sm text-gray-900 break-words">
              {log.answer}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {log.isEdited && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                แก้ไขแล้ว
              </span>
            )}
            {log.isTest && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                ทดสอบ
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onEdit(log.id, log.answer)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไข
            </button>
            <button
              onClick={() => onDelete(log.id, log.answer)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ลบ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
