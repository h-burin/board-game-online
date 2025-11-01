/**
 * Custom Hook: useFeedback
 * ดึงรายการ feedback ทั้งหมดจาก feedback collection
 * Listen แบบ real-time จาก Firestore (Admin only)
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Feedback } from '@/types/feedback';

interface UseFeedbackResult {
  feedbacks: Feedback[];
  loading: boolean;
  error: string | null;
}

export function useFeedback(): UseFeedbackResult {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reference to feedback collection
    const feedbackRef = collection(db, 'feedback');

    // Query: order by createdAt (descending - ล่าสุดก่อน)
    const q = query(feedbackRef, orderBy('createdAt', 'desc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const feedbackData: Feedback[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;

          // Convert Firestore data to Feedback type
          const feedback: Feedback = {
            id: doc.id,
            type: data.type,
            gameId: data.gameId,
            gameName: data.gameName,
            subject: data.subject,
            description: data.description,
            status: data.status || 'pending',
            createdAt: data.createdAt,
          };

          feedbackData.push(feedback);
        });

        setFeedbacks(feedbackData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to feedback:', err);
        setError('ไม่สามารถโหลด feedback ได้');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return { feedbacks, loading, error };
}
