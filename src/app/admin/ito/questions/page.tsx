'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { ItoQuestion } from '@/types/ito';
import { useAdminActivity } from '@/lib/hooks/useAdminActivity';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ItoQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ItoQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [createdBy, setCreatedBy] = useState('Admin');
  const [submitting, setSubmitting] = useState(false);

  // Track admin activity and auto-logout after 8 hours of inactivity
  useAdminActivity();

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadQuestions();
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load questions
  const loadQuestions = async () => {
    try {
      const questionsRef = collection(db, 'ito_questions');
      const snapshot = await getDocs(questionsRef);
      const questionsData: ItoQuestion[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        questionsData.push({
          id: doc.id,
          questionsTH: data.questionsTH || '',
          isActive: data.isActive ?? true, // default true ถ้าไม่มี field
          createdBy: data.createdBy,
        });
      });

      // เรียงลำดับ: isActive ก่อน (false ก่อน true) แล้วตามด้วยชื่อ (A-Z)
      questionsData.sort((a, b) => {
        // เรียง isActive ก่อน (false มาก่อน true)
        if (a.isActive !== b.isActive) {
          return a.isActive ? 1 : -1;
        }
        // ถ้า isActive เท่ากัน ให้เรียงตามชื่อ
        return a.questionsTH.localeCompare(b.questionsTH, 'th');
      });

      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('ไม่สามารถโหลดโจทย์ได้');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setCreatedBy('Admin');
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (question: ItoQuestion) => {
    setEditingQuestion(question);
    setQuestionText(question.questionsTH);
    setCreatedBy(question.createdBy || 'Admin');
    setShowModal(true);
  };

  // Save question (add or update)
  const handleSave = async () => {
    if (!questionText.trim()) {
      alert('กรุณากรอกโจทย์');
      return;
    }

    // ตรวจสอบว่าซ้ำหรือไม่ (เปรียบเทียบแบบไม่สนใจช่องว่าง)
    const normalizedNewText = questionText.trim().replace(/\s+/g, ' ').toLowerCase();

    const duplicate = questions.find((q) => {
      // ถ้าเป็นการแก้ไข ไม่ต้องเช็คกับตัวเอง
      if (editingQuestion && q.id === editingQuestion.id) {
        return false;
      }

      const normalizedExisting = q.questionsTH.trim().replace(/\s+/g, ' ').toLowerCase();
      return normalizedExisting === normalizedNewText;
    });

    if (duplicate) {
      alert(`โจทย์นี้มีอยู่แล้ว: "${duplicate.questionsTH}"`);
      return;
    }

    setSubmitting(true);

    try {
      if (editingQuestion) {
        // Update
        const questionRef = doc(db, 'ito_questions', editingQuestion.id);
        await updateDoc(questionRef, {
          questionsTH: questionText.trim(),
          createdBy: createdBy.trim() || 'Admin', // อัปเดต createdBy ด้วย
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Updated question:', editingQuestion.id);
      } else {
        // Add new
        await addDoc(collection(db, 'ito_questions'), {
          questionsTH: questionText.trim(),
          isActive: false, // ตั้งค่า default เป็น inactive
          createdBy: createdBy.trim() || 'Admin', // ใช้ค่าจาก input
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Added new question');
      }

      setShowModal(false);
      setQuestionText('');
      setCreatedBy('Admin');
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('ไม่สามารถบันทึกโจทย์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle isActive
  const handleToggleActive = async (question: ItoQuestion) => {
    try {
      const questionRef = doc(db, 'ito_questions', question.id);
      const newIsActive = !question.isActive;

      await updateDoc(questionRef, {
        isActive: newIsActive,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Toggled isActive:', question.id, newIsActive);
      loadQuestions();
    } catch (error) {
      console.error('Error toggling isActive:', error);
      alert('ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  // Delete question
  const handleDelete = async (question: ItoQuestion) => {
    if (!confirm(`ต้องการลบโจทย์ "${question.questionsTH}" หรือไม่?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'ito_questions', question.id));
      console.log('✅ Deleted question:', question.id);
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('ไม่สามารถลบโจทย์ได้');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => router.push('/admin')}
                className="mr-2 sm:mr-4 text-gray-600 hover:text-gray-900 inline-flex items-center flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">จัดการโจทย์เกม ITO</span>
                <span className="sm:hidden">โจทย์ ITO</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline text-sm text-gray-600 truncate max-w-[150px]">{user.email}</span>
              <button
                onClick={() => router.push('/')}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">หน้าหลัก</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">โจทย์ทั้งหมด</h2>
            <p className="text-xs sm:text-sm text-gray-600">จำนวน {questions.length} โจทย์</p>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors inline-flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            เพิ่มโจทย์ใหม่
          </button>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12 sm:w-20">#</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">โจทย์</th>
                  <th className="px-3 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24 sm:w-32">สถานะ</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600 text-sm sm:text-base">ยังไม่มีโจทย์</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">คลิกปุ่ม &quot;เพิ่มโจทย์ใหม่&quot; เพื่อเริ่มต้น</p>
                    </td>
                  </tr>
                ) : (
                  questions.map((question, index) => (
                    <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{index + 1}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm text-gray-900">{question.questionsTH}</div>
                        {question.createdBy && (
                          <div className="text-xs text-gray-500 mt-1">
                            สร้างโดย: {question.createdBy}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-xs font-medium ${question.isActive ? 'text-gray-400' : 'text-gray-700'}`}>
                            ปิด
                          </span>
                          <button
                            onClick={() => handleToggleActive(question)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              question.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                            role="switch"
                            aria-checked={question.isActive}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                question.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-medium ${question.isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                            เปิด
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(question)}
                            className="px-2 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDelete(question)}
                            className="px-2 sm:px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                {editingQuestion ? 'แก้ไขโจทย์' : 'เพิ่มโจทย์ใหม่'}
              </h2>

              <div className="mb-4 sm:mb-5">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  โจทย์ (ภาษาไทย)
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="เช่น ความสูง (เซนติเมตร)"
                  className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  ผู้สร้าง
                </label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="Admin"
                  className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex-1 px-3 sm:px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white text-sm sm:text-base font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
