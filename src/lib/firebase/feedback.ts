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
  query,
  where,
  getDocs,
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
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance and length ratio
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // Length difference check
  const lengthDiff = Math.abs(s1.length - s2.length);
  const maxLength = Math.max(s1.length, s2.length);
  const lengthRatio = 1 - (lengthDiff / maxLength);

  // If length difference is too large, not similar
  if (lengthRatio < 0.7) return 0;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const similarity = 1 - (distance / maxLength);

  return similarity;
}

/**
 * Check if Ito question already exists or is too similar
 * Returns: { isDuplicate: boolean, similarQuestion?: string, similarity?: number }
 */
export async function checkDuplicateItoQuestion(
  questionsTH: string
): Promise<{ isDuplicate: boolean; similarQuestion?: string; similarity?: number }> {
  try {
    const questionsRef = collection(db, 'ito_questions');
    const snapshot = await getDocs(questionsRef);

    const inputQuestion = questionsTH.trim().toLowerCase();
    const SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold

    let maxSimilarity = 0;
    let mostSimilarQuestion = '';

    snapshot.forEach((doc) => {
      const existingQuestion = doc.data().questionsTH as string;
      const similarity = calculateSimilarity(inputQuestion, existingQuestion);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarQuestion = existingQuestion;
      }
    });

    if (maxSimilarity >= SIMILARITY_THRESHOLD) {
      return {
        isDuplicate: true,
        similarQuestion: mostSimilarQuestion,
        similarity: Math.round(maxSimilarity * 100),
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Error checking duplicate question:', error);
    return { isDuplicate: false };
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
    // ตรวจสอบคำถามซ้ำ
    const duplicateCheck = await checkDuplicateItoQuestion(questionsTH);
    if (duplicateCheck.isDuplicate) {
      throw new Error(`คำถามนี้คล้ายกับคำถามที่มีอยู่แล้ว: "${duplicateCheck.similarQuestion}" (${duplicateCheck.similarity}%)`);
    }

    const questionsRef = collection(db, 'ito_questions');

    const docRef = await addDoc(questionsRef, {
      questionsTH: questionsTH.trim(),
      createdBy,
      isActive: false, // เริ่มต้นเป็น false รอ admin approve
      createdAt: serverTimestamp(),
    });

    console.log('✅ Ito question submitted:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error submitting Ito question:', error);
    if (error instanceof Error) {
      throw error;
    }
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
