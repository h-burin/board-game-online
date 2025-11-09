import { useState } from 'react';
import { deleteGameLogs, updateGameLogAnswer } from '@/lib/firebase/ito';
import { ItoGameLog } from '@/lib/hooks/useItoGameLogs';

export function useLogActions(logs: ItoGameLog[]) {
  // Delete single log
  const [deleteConfirm, setDeleteConfirm] = useState<{
    logId: string;
    answer: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit answer
  const [editingLog, setEditingLog] = useState<{
    logId: string;
    currentAnswer: string;
  } | null>(null);
  const [editedAnswer, setEditedAnswer] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete all test logs
  const [showDeleteTestConfirm, setShowDeleteTestConfirm] = useState(false);
  const [isDeletingTest, setIsDeletingTest] = useState(false);

  const handleDeleteLogs = async (logIds: string[]) => {
    setIsDeleting(true);
    try {
      const success = await deleteGameLogs(logIds);
      if (success) {
        setDeleteConfirm(null);
      } else {
        alert('เกิดข้อผิดพลาดในการลบ log');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ log');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditAnswer = async () => {
    if (!editingLog || !editedAnswer.trim()) return;

    setIsUpdating(true);
    try {
      const success = await updateGameLogAnswer(editingLog.logId, editedAnswer.trim());
      if (success) {
        setEditingLog(null);
        setEditedAnswer("");
      } else {
        alert('เกิดข้อผิดพลาดในการแก้ไขคำตอบ');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการแก้ไขคำตอบ');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAllTestLogs = async () => {
    const testLogIds = logs.filter(log => log.isTest).map(log => log.id);

    if (testLogIds.length === 0) {
      alert('ไม่มี log ทดสอบให้ลบ');
      setShowDeleteTestConfirm(false);
      return;
    }

    setIsDeletingTest(true);
    try {
      const success = await deleteGameLogs(testLogIds);
      if (success) {
        setShowDeleteTestConfirm(false);
        alert(`ลบ log ทดสอบสำเร็จ ${testLogIds.length} รายการ`);
      } else {
        alert('เกิดข้อผิดพลาดในการลบ log ทดสอบ');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ log ทดสอบ');
    } finally {
      setIsDeletingTest(false);
    }
  };

  const openEditModal = (logId: string, currentAnswer: string) => {
    setEditingLog({ logId, currentAnswer });
    setEditedAnswer(currentAnswer);
  };

  const closeEditModal = () => {
    setEditingLog(null);
    setEditedAnswer("");
  };

  return {
    // Delete single
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    handleDeleteLogs,

    // Edit
    editingLog,
    editedAnswer,
    setEditedAnswer,
    isUpdating,
    handleEditAnswer,
    openEditModal,
    closeEditModal,

    // Delete test logs
    showDeleteTestConfirm,
    setShowDeleteTestConfirm,
    isDeletingTest,
    handleDeleteAllTestLogs,
  };
}
