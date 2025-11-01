'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveAge, shouldAskAge } from '@/lib/utils/ageStorage';
import { saveAgeToFirebase } from '@/lib/firebase/age';

const AGE_RANGES = [
  { label: 'ต่ำกว่า 18 ปี', value: '0-17', emoji: '👶' },
  { label: '18-24 ปี', value: '18-24', emoji: '🎓' },
  { label: '25-34 ปี', value: '25-34', emoji: '💼' },
  { label: '35-44 ปี', value: '35-44', emoji: '👔' },
  { label: '45-54 ปี', value: '45-54', emoji: '🎯' },
  { label: '55 ปีขึ้นไป', value: '55+', emoji: '🌟' },
];

export default function AgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // ไม่แสดง modal ในหน้า admin
    const isAdminPage = pathname?.startsWith('/admin');

    // ตรวจสอบว่าต้องถามอายุหรือไม่
    if (!isAdminPage && shouldAskAge()) {
      setIsOpen(true);
    }
  }, [pathname]);

  const handleSelectRange = async (range: string) => {
    setSelectedRange(range);
    setError('');
    setIsSubmitting(true);

    try {
      // บันทึกลง localStorage (ใช้ช่วงอายุแทนตัวเลข)
      saveAge(range);

      // บันทึกลง Firebase (ไม่รอผลลัพธ์ เพื่อให้ UX ไหลลื่น)
      saveAgeToFirebase(range).catch((error) => {
        console.error('Failed to save age to Firebase:', error);
        // ไม่แสดง error ให้ user เพราะข้อมูลถูกเก็บใน localStorage แล้ว
      });

      // รอนิดหนึ่งเพื่อให้เห็น animation
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-8 py-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">ยินดีต้อนรับ!</h2>
          <p className="text-white/90 text-sm">กรุณาบอกอายุของคุณเพื่อประสบการณ์ที่ดีที่สุด</p>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="mb-6">
            <p className="text-gray-700 font-semibold mb-4 text-center">
              เลือกช่วงอายุของคุณ
            </p>

            {/* Age Range Cards */}
            <div className="grid grid-cols-2 gap-3">
              {AGE_RANGES.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => handleSelectRange(range.value)}
                  disabled={isSubmitting}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedRange === range.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{range.emoji}</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {range.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                ข้อมูลจะถูกใช้เพื่อปรับปรุงเกมให้เหมาะสมกับทุกวัย
              </p>
              <p className="text-xs text-gray-400 text-center">
                ไม่เชื่อมโยงกับตัวตน • เก็บในเครื่องของคุณ
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            เราจะถามอีกครั้งในอีก 30 วันข้างหน้า
          </p>
        </div>
      </div>
    </div>
  );
}
