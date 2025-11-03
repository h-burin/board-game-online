'use client';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
}

export default function RulesModal({ isOpen, onClose, gameName }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">กติกาการเล่น {gameName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="space-y-4 text-gray-800">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-2">📋 วิธีเล่น</h3>
              <ul className="space-y-2 text-sm md:text-base list-disc list-inside">
                <li>ผู้เล่นแต่ละคนจะได้รับตัวเลขระหว่าง <strong>1-100</strong></li>
                <li>ผู้เล่นจะต้องเรียงตัวเลขจาก <strong>น้อยไปมาก</strong> โดยไม่บอกตัวเลขโดยตรง</li>
                <li>ใช้การสื่อสารผ่านคำบรรยายเพื่อเดาว่าตัวเลขของใครใหญ่หรือเล็กกว่ากัน</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-lg md:text-xl font-bold text-green-900 mb-2">🎯 เป้าหมาย</h3>
              <p className="text-sm md:text-base">
                ผู้เล่นทุกคนต้องร่วมมือกันเพื่อเรียงลำดับให้ถูกต้อง <strong>ตามจำนวนด่านที่กำหนด</strong>
                เพื่อชนะเกม หากเรียงผิดเกินจำนวนครั้งที่กำหนด ผู้เล่นจะแพ้
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="text-lg md:text-xl font-bold text-purple-900 mb-2">💡 ตัวอย่างการสื่อสาร</h3>
              <div className="space-y-2 text-sm md:text-base">
                <p><strong>โจทย์:</strong> &quot;ความสูงของต้นไม้ที่คุณชอบ&quot;</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>ตัวเลข 10: &quot;ต้นไม้บอนไซขนาดเล็ก&quot;</li>
                  <li>ตัวเลข 50: &quot;ต้นไม้ในสวนบ้านทั่วไป&quot;</li>
                  <li>ตัวเลข 90: &quot;ต้นไม้ยักษ์ในป่า&quot;</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="text-lg md:text-xl font-bold text-yellow-900 mb-2">⚠️ กฎสำคัญ</h3>
              <ul className="space-y-2 text-sm md:text-base list-disc list-inside">
                <li><strong className="text-red-600">ห้าม</strong> บอกตัวเลขโดยตรง เช่น &quot;50&quot;</li>
                <li><strong className="text-red-600">ห้าม</strong> ใช้คำที่มีตัวเลข เช่น &quot;ห้าสิบ&quot;</li>
                <li><strong className="text-green-600">แนะนำ</strong> ให้ใช้การเปรียบเทียบและคำบรรยาย</li>
                <li><strong className="text-green-600">แนะนำ</strong> ให้สื่อสารและถามคำถามซึ่งกันและกัน</li>
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <h3 className="text-lg md:text-xl font-bold text-indigo-900 mb-2">🎮 การเล่นในระบบนี้</h3>
              <ol className="space-y-2 text-sm md:text-base list-decimal list-inside">
                <li>ระบบจะสุ่มโจทย์ให้แต่ละด่าน</li>
                <li>ผู้เล่นแต่ละคนจะได้รับตัวเลขแบบสุ่ม (1-100)</li>
                <li>พิมพ์คำตอบของคุณในช่องที่กำหนด</li>
                <li>เมื่อทุกคนส่งคำตอบแล้ว กดปุ่ม &quot;เรียงลำดับ&quot; เพื่อจัดเรียง</li>
                <li>ระบบจะตรวจสอบความถูกต้อง และเปิดเผยตัวเลขจริง</li>
                <li>หากเรียงถูกครบตามจำนวนด่านที่กำหนด = <strong className="text-green-600">ชนะ!</strong></li>
                <li>หากเรียงผิดเกินจำนวนครั้งที่กำหนด = <strong className="text-red-600">แพ้!</strong></li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-purple-300">
              <h3 className="text-lg md:text-xl font-bold text-purple-900 mb-2">✨ เคล็ดลับการเล่นให้สนุก</h3>
              <ul className="space-y-2 text-sm md:text-base list-disc list-inside">
                <li>ใช้จินตนาการและความคิดสร้างสรรค์ในการบรรยาย</li>
                <li>ถามคำถามซึ่งกันและกันเพื่อเปรียบเทียบ</li>
                <li>อย่าเพิ่งเรียงลำดับก่อนที่ทุกคนจะส่งคำตอบ</li>
                <li>ใช้เวลาพูดคุยและวางแผนร่วมกัน</li>
                <li><strong>สนุกสนานและสร้างสรรค์!</strong> นี่คือเกมสังคมที่ต้องการความร่วมมือ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 md:p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            เข้าใจแล้ว เริ่มเล่นเลย!
          </button>
        </div>
      </div>
    </div>
  );
}
