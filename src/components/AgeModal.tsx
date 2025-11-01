'use client';

import { useState, useEffect } from 'react';
import { saveAge, shouldAskAge } from '@/lib/utils/ageStorage';
import { saveAgeToFirebase } from '@/lib/firebase/age';

export default function AgeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าต้องถามอายุหรือไม่
    if (shouldAskAge()) {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(age, 10);

    // Validation
    if (isNaN(ageNum)) {
      setError('กรุณากรอกอายุเป็นตัวเลข');
      return;
    }

    if (ageNum < 1 || ageNum > 100) {
      setError('กรุณากรอกอายุระหว่าง 1-100 ปี');
      return;
    }

    setIsSubmitting(true);

    try {
      // บันทึกลง localStorage
      saveAge(ageNum);

      // บันทึกลง Firebase (ไม่รอผลลัพธ์ เพื่อให้ UX ไหลลื่น)
      saveAgeToFirebase(ageNum).catch((error) => {
        console.error('Failed to save age to Firebase:', error);
        // ไม่แสดง error ให้ user เพราะข้อมูลถูกเก็บใน localStorage แล้ว
      });

      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (value: string) => {
    // อนุญาตเฉพาะตัวเลข
    if (value === '' || /^\d+$/.test(value)) {
      setAge(value);
      setError('');
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
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label htmlFor="age" className="block text-gray-700 font-semibold mb-3 text-center">
              อายุของคุณ (ปี)
            </label>

            {/* Age Input with beautiful style */}
            <div className="relative">
              <input
                type="text"
                id="age"
                value={age}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="25"
                autoFocus
                className={`w-full text-center text-4xl font-bold py-6 rounded-2xl border-2 ${
                  error ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-4 ${
                  error ? 'focus:ring-red-200' : 'focus:ring-blue-200'
                } focus:border-blue-500 transition-all`}
                maxLength={3}
              />
              {age && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
                  ปี
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
            )}

            {/* Info */}
            <p className="mt-3 text-xs text-gray-500 text-center">
              ข้อมูลจะถูกเก็บไว้ในเครื่องของคุณเท่านั้น
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!age || isSubmitting}
            className="w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg text-lg"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
          </button>
        </form>

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
