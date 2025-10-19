'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-white/70 hover:text-white mb-4 flex items-center gap-2"
          >
            ← กลับหน้า Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">จัดการเกม: {game.name}</h1>
        </div>

        {/* Game Info Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 mb-6">
          {game.imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden aspect-video max-w-md">
              <img
                src={game.imageUrl}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
          {game.description && (
            <p className="text-white/70 mb-4">{game.description}</p>
          )}
        </div>

        {/* Player Range Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">ตั้งค่าจำนวนผู้เล่น</h3>

          <div className="space-y-4">
            {/* Min Player */}
            <div>
              <label className="block text-white mb-2">จำนวนผู้เล่นขั้นต่ำ</label>
              <input
                type="number"
                min="1"
                value={minPlayer || ''}
                onChange={(e) => setMinPlayer(Number(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Player */}
            <div>
              <label className="block text-white mb-2">จำนวนผู้เล่นสูงสุด</label>
              <input
                type="number"
                min="1"
                value={maxPlayer || ''}
                onChange={(e) => setMaxPlayer(Number(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Current Range Display */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/70">
                จำนวนผู้เล่น: <span className="text-white font-bold">{minPlayer}-{maxPlayer}</span> คน
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </div>

        {/* Additional Features - Only for games with questions */}
        {gameId === 'BWLxJkh45e6RiALRBmcl' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">จัดการเนื้อหาเกม</h3>
            <button
              onClick={() => router.push('/admin/ito/questions')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold transition-all"
            >
              จัดการโจทย์ ITO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
