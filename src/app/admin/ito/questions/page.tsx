'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { ItoQuestion } from '@/types/ito';

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ItoQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ItoQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        questionsData.push({
          id: doc.id,
          questionsTH: doc.data().questionsTH || '',
        });
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
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (question: ItoQuestion) => {
    setEditingQuestion(question);
    setQuestionText(question.questionsTH);
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
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Updated question:', editingQuestion.id);
      } else {
        // Add new
        await addDoc(collection(db, 'ito_questions'), {
          questionsTH: questionText.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Added new question');
      }

      setShowModal(false);
      setQuestionText('');
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('ไม่สามารถบันทึกโจทย์ได้');
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">จัดการโจทย์เกม ITO</h1>
              <p className="text-white/70">Logged in as: {user.email}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
              >
                ← หน้าหลัก
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 rounded-xl bg-red-500/50 hover:bg-red-500/70 text-white font-bold transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleAdd}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all transform hover:scale-105"
          >
            + เพิ่มโจทย์ใหม่
          </button>
        </div>

        {/* Questions Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/10 border-b border-white/20">
                <th className="px-6 py-4 text-left text-white font-bold">#</th>
                <th className="px-6 py-4 text-left text-white font-bold">โจทย์</th>
                <th className="px-6 py-4 text-right text-white font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/70">
                    ยังไม่มีโจทย์ กรุณาเพิ่มโจทย์ใหม่
                  </td>
                </tr>
              ) : (
                questions.map((question, index) => (
                  <tr key={question.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/70">{index + 1}</td>
                    <td className="px-6 py-4 text-white">{question.questionsTH}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(question)}
                        className="px-4 py-2 rounded-lg bg-blue-500/50 hover:bg-blue-500/70 text-white font-bold mr-2 transition-colors"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(question)}
                        className="px-4 py-2 rounded-lg bg-red-500/50 hover:bg-red-500/70 text-white font-bold transition-colors"
                      >
                        ❌ ลบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total count */}
        <div className="mt-4 text-right text-white/70">
          ทั้งหมด {questions.length} โจทย์
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 border border-white/20 max-w-lg w-full">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingQuestion ? 'แก้ไขโจทย์' : 'เพิ่มโจทย์ใหม่'}
              </h2>

              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  โจทย์ (ภาษาไทย)
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="เช่น ความสูง (เซนติเมตร)"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-500/50 hover:bg-gray-500/70 disabled:opacity-50 text-white font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold transition-all"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
