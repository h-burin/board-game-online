'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useGames } from '@/lib/hooks/useGames';
import { useAdminActivity } from '@/lib/hooks/useAdminActivity';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { games, loading: gamesLoading } = useGames();

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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="ml-2 sm:ml-3 text-base sm:text-xl font-semibold text-gray-900 truncate">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline text-sm text-gray-600 truncate max-w-[150px]">{user.email}</span>
              <button
                onClick={() => router.push('/')}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="hidden sm:inline">หน้าหลัก</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/admin/feedback')}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 p-6 rounded-xl border-2 border-gray-200 hover:border-slate-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">Feedback</h3>
                <p className="text-sm text-gray-600">จัดการข้อเสนอแนะจากผู้ใช้</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/analytics')}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">User Analytics</h3>
                <p className="text-sm text-gray-600">ดูข้อมูลสถิติผู้ใช้งาน</p>
              </div>
            </div>
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">จัดการเกม</h2>
          <p className="text-sm sm:text-base text-gray-600">เลือกเกมที่ต้องการจัดการและแก้ไข</p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600">ไม่พบข้อมูลเกม</p>
            </div>
          ) : (
            games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="bg-white rounded-lg shadow border border-gray-200 hover:border-slate-400 hover:shadow-md transition-all text-left overflow-hidden group"
              >
                {/* Game Image */}
                {game.imageUrl && (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={game.imageUrl}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Game Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{game.name}</h3>

                  {/* Game Description */}
                  {game.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{game.description}</p>
                  )}

                  {/* Player Range */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {game.minPlayer}-{game.maxPlayer} คน
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      จัดการ →
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Total count */}
        {games.length > 0 && (
          <div className="mt-8 text-right">
            <span className="text-sm text-gray-600">ทั้งหมด {games.length} เกม</span>
          </div>
        )}
      </div>
    </div>
  );
}
