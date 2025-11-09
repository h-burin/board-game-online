interface EditAnswerModalProps {
  isOpen: boolean;
  currentAnswer: string;
  editedAnswer: string;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onAnswerChange: (answer: string) => void;
}

export function EditAnswerModal({
  isOpen,
  currentAnswer,
  editedAnswer,
  isUpdating,
  onClose,
  onSubmit,
  onAnswerChange,
}: EditAnswerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">แก้ไขคำตอบ</h3>
            <p className="text-sm text-gray-600">แก้ไขคำตอบที่บันทึกไว้</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำตอบเดิม
          </label>
          <div className="bg-gray-50 rounded-lg p-3 text-gray-600 text-sm">
            {currentAnswer}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำตอบใหม่
          </label>
          <input
            type="text"
            value={editedAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="กรอกคำตอบใหม่"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editedAnswer.trim()) {
                onSubmit();
              }
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            disabled={isUpdating || !editedAnswer.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              'บันทึก'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
