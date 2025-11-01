'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaBug, FaLightbulb, FaChevronLeft, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useGames } from '@/lib/hooks/useGames';
import { submitFeedback, submitItoQuestion, checkDuplicateItoQuestion } from '@/lib/firebase/feedback';
import type { FeedbackType } from '@/types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select-type' | 'fill-form';

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { games, loading: gamesLoading } = useGames();
  const [step, setStep] = useState<Step>('select-type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form fields for issue report
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Form fields for Ito question
  const [questionsTH, setQuestionsTH] = useState('');
  const [userName, setUserName] = useState('');

  // Duplicate check
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const resetForm = () => {
    setStep('select-type');
    setFeedbackType(null);
    setSelectedGameId('');
    setSubject('');
    setDescription('');
    setQuestionsTH('');
    setUserName('');
    setIsDuplicate(false);
    setIsChecking(false);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (type: FeedbackType) => {
    setFeedbackType(type);
    setStep('fill-form');
  };

  const handleBack = () => {
    if (step === 'fill-form') {
      setStep('select-type');
      setSelectedGameId('');
      setSubject('');
      setDescription('');
      setQuestionsTH('');
      setUserName('');
      setIsDuplicate(false);
      setIsChecking(false);
    }
  };

  // Check for duplicate question when typing
  useEffect(() => {
    if (feedbackType === 'improvement' && selectedGameId === 'BWLxJkh45e6RiALRBmcl' && questionsTH.trim().length > 5) {
      const timeoutId = setTimeout(async () => {
        setIsChecking(true);
        const duplicate = await checkDuplicateItoQuestion(questionsTH);
        setIsDuplicate(duplicate);
        setIsChecking(false);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setIsDuplicate(false);
      setIsChecking(false);
    }
  }, [questionsTH, feedbackType, selectedGameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !selectedGameId) return;

    setSubmitting(true);

    try {
      const selectedGame = games.find(g => g.id === selectedGameId);
      if (!selectedGame) throw new Error('Game not found');

      if (feedbackType === 'issue') {
        // Submit feedback
        await submitFeedback({
          type: feedbackType,
          gameId: selectedGameId,
          gameName: selectedGame.name,
          subject,
          description,
        });
      } else {
        // Submit Ito question
        if (selectedGameId === 'BWLxJkh45e6RiALRBmcl') {
          if (isDuplicate) {
            throw new Error('คำถามนี้มีอยู่ในระบบแล้ว');
          }
          await submitItoQuestion(questionsTH, userName);
        } else {
          throw new Error('ขณะนี้รองรับเฉพาะเกม Ito เท่านั้น');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            {step === 'fill-form' && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'select-type' ? 'ช่วยเราปรับปรุง' : feedbackType === 'issue' ? 'แจ้งปัญหา' : 'ช่วยปรับปรุงเกม'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-600 text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">ส่งข้อมูลเรียบร้อย!</h3>
              <p className="text-gray-600">ขอบคุณที่ช่วยเราปรับปรุงระบบ</p>
            </div>
          ) : step === 'select-type' ? (
            // Step 1: Select Type
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">เลือกประเภทที่คุณต้องการ</p>

              <button
                onClick={() => handleSelectType('issue')}
                className="w-full bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaBug className="text-4xl mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">แจ้งปัญหา</h3>
                <p className="text-sm text-white/90">พบบั๊กหรือข้อผิดพลาดในระบบ</p>
              </button>

              <button
                onClick={() => handleSelectType('improvement')}
                className="w-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaLightbulb className="text-4xl mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">ช่วยปรับปรุงเกม</h3>
                <p className="text-sm text-white/90">เพิ่มโจทย์หรือเนื้อหาในเกม</p>
              </button>
            </div>
          ) : (
            // Step 2: Fill Form
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Select Game */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  เลือกเกม <span className="text-red-500">*</span>
                </label>
                {gamesLoading ? (
                  <div className="text-gray-500">กำลังโหลดรายการเกม...</div>
                ) : (
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- เลือกเกม --</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {feedbackType === 'issue' ? (
                // Issue Report Form
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      หัวข้อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder="เช่น ปุ่มกดไม่ได้, หน้าจอค้าง"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      รายละเอียด <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={5}
                      placeholder="อธิบายปัญหาที่พบให้ละเอียด..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              ) : (
                // Improvement Form (Ito Question)
                <>
                  {selectedGameId && selectedGameId !== 'BWLxJkh45e6RiALRBmcl' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        ขณะนี้รองรับการเพิ่มโจทย์เฉพาะเกม <strong>Ito</strong> เท่านั้น
                      </p>
                    </div>
                  )}

                  {(!selectedGameId || selectedGameId === 'BWLxJkh45e6RiALRBmcl') && (
                    <>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          ชื่อของคุณ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required={selectedGameId === 'BWLxJkh45e6RiALRBmcl'}
                          placeholder="ชื่อหรือชื่อเล่น"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          คำถามโจทย์ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={questionsTH}
                          onChange={(e) => setQuestionsTH(e.target.value)}
                          required={selectedGameId === 'BWLxJkh45e6RiALRBmcl'}
                          rows={3}
                          placeholder="เช่น ความสูงของต้นไม้ที่คุณชอบ, ความร้อนของกาแฟที่เหมาะสม"
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isDuplicate ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 ${
                            isDuplicate ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                          } focus:border-transparent resize-none`}
                        />

                        {/* Duplicate Check Result */}
                        {questionsTH.trim().length > 5 && (
                          <div className="mt-2">
                            {isChecking ? (
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                กำลังตรวจสอบ...
                              </p>
                            ) : isDuplicate ? (
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <FaExclamationTriangle />
                                คำถามนี้มีอยู่ในระบบแล้ว กรุณาเปลี่ยนคำถาม
                              </p>
                            ) : (
                              <p className="text-sm text-green-600 flex items-center gap-2">
                                <FaCheckCircle />
                                คำถามนี้ยังไม่มีในระบบ
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  (feedbackType === 'improvement' && selectedGameId !== 'BWLxJkh45e6RiALRBmcl') ||
                  (feedbackType === 'improvement' && isDuplicate) ||
                  isChecking
                }
                className="w-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                {submitting ? 'กำลังส่ง...' : isChecking ? 'กำลังตรวจสอบ...' : 'ส่งข้อมูล'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
