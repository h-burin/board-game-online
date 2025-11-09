interface LogFiltersProps {
  // Filter states and setters
  selectedAgeRange: string;
  setSelectedAgeRange: (value: string) => void;
  selectedQuestion: string;
  setSelectedQuestion: (value: string) => void;
  minNumber: string;
  setMinNumber: (value: string) => void;
  maxNumber: string;
  setMaxNumber: (value: string) => void;
  selectedEditStatus: string;
  setSelectedEditStatus: (value: string) => void;
  selectedTestStatus: string;
  setSelectedTestStatus: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;

  // Data
  questions: { [key: string]: string };
  totalLogs: number;
  filteredCount: number;

  // Actions
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function LogFilters({
  selectedAgeRange,
  setSelectedAgeRange,
  selectedQuestion,
  setSelectedQuestion,
  minNumber,
  setMinNumber,
  maxNumber,
  setMaxNumber,
  selectedEditStatus,
  setSelectedEditStatus,
  selectedTestStatus,
  setSelectedTestStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  questions,
  totalLogs,
  filteredCount,
  hasActiveFilters,
  onResetFilters,
}: LogFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        ตัวกรองข้อมูล
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Age Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงอายุ
          </label>
          <select
            value={selectedAgeRange}
            onChange={(e) => setSelectedAgeRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="1-10">1-10</option>
            <option value="11-20">11-20</option>
            <option value="21-30">21-30</option>
            <option value="31-40">31-40</option>
            <option value="41-50">41-50</option>
            <option value="51-60">51-60</option>
            <option value="61-70">61-70</option>
            <option value="71-80">71-80</option>
            <option value="81-90">81-90</option>
            <option value="91-100">91-100</option>
          </select>
        </div>

        {/* Question Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำถาม
          </label>
          <select
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            {Object.entries(questions).map(([id, question]) => (
              <option key={id} value={id}>
                {question}
              </option>
            ))}
          </select>
        </div>

        {/* Edit Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะการแก้ไข
          </label>
          <select
            value={selectedEditStatus}
            onChange={(e) => setSelectedEditStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="edited">แก้ไขแล้ว</option>
            <option value="original">ต้นฉบับ</option>
          </select>
        </div>

        {/* Test Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะการทดสอบ
          </label>
          <select
            value={selectedTestStatus}
            onChange={(e) => setSelectedTestStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="test">คำตอบทดสอบ</option>
            <option value="real">คำตอบจริง</option>
          </select>
        </div>

        {/* Min Number Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ตัวเลขขั้นต่ำ
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={minNumber}
            onChange={(e) => setMinNumber(e.target.value)}
            placeholder="1-100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Max Number Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ตัวเลขสูงสุด
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={maxNumber}
            onChange={(e) => setMaxNumber(e.target.value)}
            placeholder="1-100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          แสดง <span className="font-semibold text-gray-900">{filteredCount}</span> จาก{' '}
          <span className="font-semibold text-gray-900">{totalLogs}</span> รายการ
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  );
}
