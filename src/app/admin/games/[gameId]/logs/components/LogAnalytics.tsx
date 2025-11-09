interface LogAnalyticsProps {
  totalLogs: number;
  filteredLogs: number;
  testLogsCount: number;
  editedLogsCount: number;
  displayCount: number;
  onDeleteAllTestLogs: () => void;
}

export function LogAnalytics({
  totalLogs,
  filteredLogs,
  testLogsCount,
  editedLogsCount,
  displayCount,
  onDeleteAllTestLogs,
}: LogAnalyticsProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        สถิติ
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-xs font-medium text-blue-600 mb-1">
            ทั้งหมด
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {totalLogs}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            รายการ
          </div>
        </div>

        {/* Filtered Logs */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-xs font-medium text-green-600 mb-1">
            กรองแล้ว
          </div>
          <div className="text-2xl font-bold text-green-900">
            {filteredLogs}
          </div>
          <div className="text-xs text-green-700 mt-1">
            รายการ
          </div>
        </div>

        {/* Test Logs */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-xs font-medium text-orange-600 mb-1">
            ทดสอบ
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {testLogsCount}
          </div>
          <div className="text-xs text-orange-700 mt-1">
            รายการ
          </div>
        </div>

        {/* Edited Logs */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
          <div className="text-xs font-medium text-yellow-600 mb-1">
            แก้ไขแล้ว
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {editedLogsCount}
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            รายการ
          </div>
        </div>
      </div>

      {/* Display Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          แสดง <span className="font-semibold text-gray-900">{displayCount}</span> จาก{' '}
          <span className="font-semibold text-gray-900">{filteredLogs}</span> รายการที่กรอง
        </div>

        {testLogsCount > 0 && (
          <button
            onClick={onDeleteAllTestLogs}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบ Log ทดสอบทั้งหมด
          </button>
        )}
      </div>
    </div>
  );
}
