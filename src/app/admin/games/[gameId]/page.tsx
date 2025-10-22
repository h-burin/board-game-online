'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAdminActivity } from '@/lib/hooks/useAdminActivity';

interface Game {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  minPlayer: number;
  maxPlayer: number;
}

export default function GameManagementPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [minPlayer, setMinPlayer] = useState<number>(1);
  const [maxPlayer, setMaxPlayer] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Track admin activity and auto-logout after 8 hours of inactivity
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

  // Load game data
  useEffect(() => {
    if (!gameId) return;

    const loadGame = async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (gameDoc.exists()) {
          const gameData = { id: gameDoc.id, ...gameDoc.data() } as Game;
          setGame(gameData);
          setMinPlayer(gameData.minPlayer ?? 1);
          setMaxPlayer(gameData.maxPlayer ?? 1);
        } else {
          alert('ไม่พบข้อมูลเกม');
          router.push('/admin');
        }
      } catch (error) {
        console.error('Error loading game:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    loadGame();
  }, [gameId, router]);

  // Save player range
  const handleSave = async () => {
    if (!game) return;

    // Validation
    if (minPlayer < 1) {
      alert('จำนวนผู้เล่นขั้นต่ำต้องมากกว่า 0');
      return;
    }

    if (maxPlayer < minPlayer) {
      alert('จำนวนผู้เล่นสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'games', gameId), {
        minPlayer: minPlayer,
        maxPlayer: maxPlayer,
      });
      alert('บันทึกสำเร็จ');
    } catch (error) {
      console.error('Error saving:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !game) {
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
          <div className="flex items-center h-16 min-w-0">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-gray-900 truncate">
              <span className="hidden sm:inline">จัดการเกม: </span>{game.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Game Info Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {game.imageUrl && (
              <div className="w-full sm:w-48 h-40 sm:h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={game.imageUrl}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{game.name}</h2>
              {game.description && (
                <p className="text-gray-600 text-sm">{game.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Player Range Settings */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">ตั้งค่าจำนวนผู้เล่น</h3>

          <div className="space-y-4">
            {/* Min Player */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">จำนวนผู้เล่นขั้นต่ำ</label>
              <input
                type="number"
                min="1"
                value={minPlayer || ''}
                onChange={(e) => setMinPlayer(Number(e.target.value) || 1)}
                className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Max Player */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">จำนวนผู้เล่นสูงสุด</label>
              <input
                type="number"
                min="1"
                value={maxPlayer || ''}
                onChange={(e) => setMaxPlayer(Number(e.target.value) || 1)}
                className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Current Range Display */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <p className="text-gray-600 text-sm">
                จำนวนผู้เล่น: <span className="text-gray-900 font-semibold">{minPlayer}-{maxPlayer} คน</span>
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 sm:px-6 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:bg-gray-400 text-white font-semibold transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </div>

        {/* Additional Features - Only for games with questions */}
        {gameId === 'BWLxJkh45e6RiALRBmcl' && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">จัดการเนื้อหาเกม</h3>
            <button
              onClick={() => router.push('/admin/ito/questions')}
              className="w-full px-4 sm:px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              จัดการโจทย์ ITO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
