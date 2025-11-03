import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ItoGameLog {
  id: string;
  questionId: string;
  ageRange: string | null;
  number: number;
  answer: string;
  createdAt: any;
}

export function useItoGameLogs() {
  const [logs, setLogs] = useState<ItoGameLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, 'ito_game_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ItoGameLog[];

      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { logs, loading };
}

// Hook สำหรับดึง questions ทั้งหมดเพื่อ map questionId -> questionText
export function useItoQuestions() {
  const [questions, setQuestions] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, 'ito_questions');
        const snapshot = await getDocs(questionsRef);

        const questionsMap: { [id: string]: string } = {};
        snapshot.docs.forEach((doc) => {
          questionsMap[doc.id] = doc.data().questionsTH || 'ไม่มีโจทย์';
        });

        setQuestions(questionsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return { questions, loading };
}
