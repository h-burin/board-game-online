'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useUserAnalytics } from '@/lib/hooks/useUserAnalytics';
import { useAdminActivity } from '@/lib/hooks/useAdminActivity';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { analytics, loading: analyticsLoading } = useUserAnalytics();

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

  // คำนวณสถิติ
  const stats = useMemo(() => {
    if (!analytics.length) return null;

    // นับจำนวนแต่ละช่วงอายุ
    const ageRanges: Record<string, number> = {};
    analytics.forEach((a) => {
      ageRanges[a.ageRange] = (ageRanges[a.ageRange] || 0) + 1;
    });

    // นับจำนวนแต่ละประเภทอุปกรณ์
    const deviceTypes: Record<string, number> = {};
    analytics.forEach((a) => {
      deviceTypes[a.deviceType] = (deviceTypes[a.deviceType] || 0) + 1;
    });

    // นับจำนวนแต่ละ OS
    const osList: Record<string, number> = {};
    analytics.forEach((a) => {
      osList[a.os] = (osList[a.os] || 0) + 1;
    });

    // นับจำนวนแต่ละ Browser
    const browsers: Record<string, number> = {};
    analytics.forEach((a) => {
      browsers[a.browser] = (browsers[a.browser] || 0) + 1;
    });

    // คำนวณ screen size เฉลี่ย
    const avgScreenWidth = Math.round(
      analytics.reduce((sum, a) => sum + a.screenWidth, 0) / analytics.length
    );
    const avgScreenHeight = Math.round(
      analytics.reduce((sum, a) => sum + a.screenHeight, 0) / analytics.length
    );

    return {
      total: analytics.length,
      ageRanges,
      deviceTypes,
      osList,
      browsers,
      avgScreenWidth,
      avgScreenHeight,
    };
  }, [analytics]);

  if (loading || analyticsLoading) {
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">User Analytics</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!stats ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-600">ยังไม่มีข้อมูล Analytics</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/80 text-sm">จำนวนผู้ใช้ทั้งหมด</p>
                  <p className="text-4xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-white/80 text-xs mb-1">ความละเอียดหน้าจอเฉลี่ย</p>
                  <p className="text-lg font-semibold">{stats.avgScreenWidth} × {stats.avgScreenHeight}</p>
                </div>
              </div>
            </div>

            {/* Age Ranges */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                ช่วงอายุ
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.ageRanges)
                  .sort(([, a], [, b]) => b - a)
                  .map(([range, count]) => {
                    const percentage = ((count / stats.total) * 100).toFixed(1);
                    return (
                      <div key={range}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{range} ปี</span>
                          <span className="text-sm text-gray-600">{count} คน ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                ประเภทอุปกรณ์
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.deviceTypes).map(([type, count]) => {
                  const percentage = ((count / stats.total) * 100).toFixed(1);
                  const emoji = type === 'mobile' ? '📱' : type === 'tablet' ? '📱' : type === 'desktop' ? '💻' : '❓';
                  return (
                    <div key={type} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">{emoji}</div>
                      <p className="text-sm font-medium text-gray-700 capitalize mb-1">{type}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-600">{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operating Systems */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💿</span>
                ระบบปฏิบัติการ
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.osList)
                  .sort(([, a], [, b]) => b - a)
                  .map(([os, count]) => {
                    const percentage = ((count / stats.total) * 100).toFixed(1);
                    return (
                      <div key={os}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{os}</span>
                          <span className="text-sm text-gray-600">{count} คน ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-purple-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Browsers */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                เว็บเบราว์เซอร์
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.browsers)
                  .sort(([, a], [, b]) => b - a)
                  .map(([browser, count]) => {
                    const percentage = ((count / stats.total) * 100).toFixed(1);
                    return (
                      <div key={browser}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{browser}</span>
                          <span className="text-sm text-gray-600">{count} คน ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
