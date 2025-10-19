'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useGames } from '@/lib/hooks/useGames';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { games, loading: gamesLoading } = useGames();

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navigate to game admin page
  const handleGameClick = (gameId: string) => {
    router.push(`/admin/games/${gameId}`);
  };

  if (loading || gamesLoading) {
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
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
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

        {/* Games Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">เลือกเกมที่ต้องการจัดการ</h2>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.length === 0 ? (
            <div className="col-span-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70">ไม่พบข้อมูลเกม</p>
            </div>
          ) : (
            games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105 text-left"
              >
                {/* Game Image */}
                {game.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden aspect-video">
                    <img
                      src={game.imageUrl}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Game Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>

                {/* Game Description */}
                {game.description && (
                  <p className="text-white/70 mb-4 line-clamp-2">{game.description}</p>
                )}

                {/* Player Range */}
                <div className="text-white/50 text-sm mb-4">
                  ผู้เล่น: {game.minPlayer}-{game.maxPlayer} คน
                </div>

                {/* Action Button */}
                <div className="text-center">
                  <span className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                    จัดการ
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Total count */}
        {games.length > 0 && (
          <div className="mt-6 text-right text-white/70">
            ทั้งหมด {games.length} เกม
          </div>
        )}
      </div>
    </div>
  );
}
