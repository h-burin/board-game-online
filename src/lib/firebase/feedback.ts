/**
 * Feedback Firebase Functions
 * จัดการ feedback และ suggested content
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Feedback, SuggestedItoQuestion } from '@/types/feedback';

/**
 * Submit feedback (แจ้งปัญหา)
 */
export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const feedbackRef = collection(db, 'feedback');

    const docRef = await addDoc(feedbackRef, {
      ...feedback,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    console.log('✅ Feedback submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    throw new Error('ไม่สามารถส่ง feedback ได้');
  }
}

/**
 * Submit suggested Ito question (ช่วยปรับปรุงเกม Ito)
 */
export async function submitItoQuestion(
  questionsTH: string,
  createdBy: string
): Promise<string> {
  try {
    const questionsRef = collection(db, 'ito_questions');

    const docRef = await addDoc(questionsRef, {
      questionsTH,
      createdBy,
      isActive: false, // เริ่มต้นเป็น false รอ admin approve
      createdAt: serverTimestamp(),
    });

    console.log('✅ Ito question submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error submitting Ito question:', error);
    throw new Error('ไม่สามารถส่งคำถามได้');
  }
}

/**
 * Update feedback status (Admin only)
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'pending' | 'reviewed' | 'resolved'
): Promise<void> {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await updateDoc(feedbackRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Feedback status updated:', feedbackId);
  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    throw new Error('ไม่สามารถอัพเดทสถานะได้');
  }
}

/**
 * Delete feedback (Admin only)
 */
export async function deleteFeedback(feedbackId: string): Promise<void> {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await deleteDoc(feedbackRef);

    console.log('✅ Feedback deleted:', feedbackId);
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    throw new Error('ไม่สามารถลบ feedback ได้');
  }
}
