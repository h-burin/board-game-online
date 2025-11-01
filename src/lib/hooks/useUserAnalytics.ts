/**
 * Hook สำหรับดึงข้อมูล User Analytics จาก Firebase
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserAnalytics } from '@/lib/firebase/age';

export function useUserAnalytics() {
  const [analytics, setAnalytics] = useState<(UserAnalytics & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyticsRef = collection(db, 'user_analytics');
    const q = query(analyticsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const analyticsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (UserAnalytics & { id: string })[];

        setAnalytics(analyticsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user analytics:', err);
        setError('ไม่สามารถโหลดข้อมูล analytics ได้');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { analytics, loading, error };
}
