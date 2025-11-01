'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useFeedback } from '@/lib/hooks/useFeedback';
import { updateFeedbackStatus, deleteFeedback } from '@/lib/firebase/feedback';
import { useAdminActivity } from '@/lib/hooks/useAdminActivity';
import { FaBug, FaLightbulb, FaCheck, FaEye, FaClock, FaTrash, FaArrowLeft } from 'react-icons/fa';
import type { Feedback } from '@/types/feedback';

type FilterStatus = 'all' | 'pending' | 'reviewed' | 'resolved';

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { feedbacks, loading: feedbacksLoading } = useFeedback();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [updating, setUpdating] = useState(false);

  useAdminActivity();

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Filter feedbacks (แสดงเฉพาะแจ้งปัญหา)
  const filteredFeedbacks = feedbacks
    .filter((feedback) => feedback.type === 'issue')
    .filter((feedback) => {
      if (filterStatus !== 'all' && feedback.status !== filterStatus) return false;
      return true;
    });

  // Handle status update
  const handleStatusUpdate = async (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    setUpdating(true);
    try {
      await updateFeedbackStatus(feedbackId, status);
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status });
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async (feedbackId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ feedback นี้?')) return;

    setUpdating(true);
    try {
      await deleteFeedback(feedbackId);
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(null);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ feedback');
    } finally {
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1"><FaClock className="text-xs" /> รอดำเนินการ</span>;
      case 'reviewed':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1"><FaEye className="text-xs" /> ตรวจสอบแล้ว</span>;
      case 'resolved':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1"><FaCheck className="text-xs" /> เสร็จสิ้น</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    return type === 'issue' ? <FaBug className="text-red-500" /> : <FaLightbulb className="text-blue-500" />;
  };

  if (loading || feedbacksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">จัดการ Feedback</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">กรองตามสถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="reviewed">ตรวจสอบแล้ว</option>
              <option value="resolved">เสร็จสิ้น</option>
            </select>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{feedbacks.filter(f => f.type === 'issue').length}</div>
                <div className="text-sm text-gray-600">ทั้งหมด</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{feedbacks.filter(f => f.type === 'issue' && f.status === 'pending').length}</div>
                <div className="text-sm text-gray-600">รอดำเนินการ</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{feedbacks.filter(f => f.type === 'issue' && f.status === 'reviewed').length}</div>
                <div className="text-sm text-gray-600">ตรวจสอบแล้ว</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{feedbacks.filter(f => f.type === 'issue' && f.status === 'resolved').length}</div>
                <div className="text-sm text-gray-600">เสร็จสิ้น</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                <p className="text-gray-600">ไม่มี feedback</p>
              </div>
            ) : (
              filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  onClick={() => setSelectedFeedback(feedback)}
                  className={`bg-white rounded-lg shadow border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedFeedback?.id === feedback.id ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1">{getTypeIcon(feedback.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{feedback.subject}</h3>
                        {getStatusBadge(feedback.status || 'pending')}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{feedback.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>เกม: {feedback.gameName}</span>
                        <span>•</span>
                        <span>{formatDate(feedback.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail View */}
          <div className="sticky top-24 h-fit">
            {selectedFeedback ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">{getTypeIcon(selectedFeedback.type)}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedFeedback.subject}</h2>
                    {getStatusBadge(selectedFeedback.status || 'pending')}
                  </div>
                </div>

                <div className="space-y-4 mb-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เกม</label>
                    <p className="text-gray-900">{selectedFeedback.gameName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                    <p className="text-gray-900">{formatDate(selectedFeedback.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700">อัพเดทสถานะ</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selectedFeedback.id!, 'pending')}
                      disabled={updating || selectedFeedback.status === 'pending'}
                      className="px-3 py-2 text-sm rounded-lg border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      รอดำเนินการ
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedFeedback.id!, 'reviewed')}
                      disabled={updating || selectedFeedback.status === 'reviewed'}
                      className="px-3 py-2 text-sm rounded-lg border-2 border-blue-500 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ตรวจสอบแล้ว
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedFeedback.id!, 'resolved')}
                      disabled={updating || selectedFeedback.status === 'resolved'}
                      className="px-3 py-2 text-sm rounded-lg border-2 border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(selectedFeedback.id!)}
                    disabled={updating}
                    className="w-full px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <FaTrash /> ลบ Feedback
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                <p className="text-gray-600">เลือก feedback เพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
