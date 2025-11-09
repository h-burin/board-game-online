"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useItoGameLogs, useItoQuestions } from "@/lib/hooks/useItoGameLogs";
import { useAdminActivity } from "@/lib/hooks/useAdminActivity";

// Custom hooks
import { useLogFilters } from "./hooks/useLogFilters";
import { useLogActions } from "./hooks/useLogActions";

// Modal components
import { EditAnswerModal } from "./components/modals/EditAnswerModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { DeleteTestLogsModal } from "./components/modals/DeleteTestLogsModal";
import { DeleteTestLogsButton } from "./components/DeleteTestLogsButton";

export default function ItoGameLogsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState<string>("Game");

  // Data
  const { logs, loading: logsLoading } = useItoGameLogs();
  const { questions, loading: questionsLoading } = useItoQuestions();

  // Custom hooks
  const filters = useLogFilters(logs, questions);
  const actions = useLogActions(logs);

  // Pagination
  const [displayCount, setDisplayCount] = useState(20);
  const LOAD_MORE_COUNT = 20;

  useAdminActivity();

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch game name
        try {
          const gameRef = doc(db, "games", gameId);
          const gameSnap = await getDoc(gameRef);
          if (gameSnap.exists()) {
            setGameName(gameSnap.data().name || "Game");
          }
        } catch (error) {
          console.error("Error fetching game:", error);
        }
      } else {
        router.push("/admin/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, router]);

  // Calculate test logs count
  const testLogsCount = logs.filter(log => log.isTest).length;

  if (loading || logsLoading || questionsLoading) {
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
                onClick={() => router.push(`/admin/games/${gameId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {gameName} Logs
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section - TODO: Extract to LogFilters component */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            ตัวกรองข้อมูล
          </h2>

          {/* Filter controls would go here */}
          <div className="text-sm text-gray-600">
            Filtered: {filters.filteredLogs.length} / {logs.length} logs
          </div>

          {/* Reset Filters & Delete Test Logs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {filters.hasActiveFilters && (
              <button
                onClick={filters.resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ล้างตัวกรอง
              </button>
            )}

            <DeleteTestLogsButton
              testLogsCount={testLogsCount}
              onClick={() => actions.setShowDeleteTestConfirm(true)}
            />
          </div>
        </div>

        {/* Analytics Section - TODO: Extract to LogAnalytics component */}
        <div className="mb-6">
          <div className="text-sm text-gray-600">
            Showing {Math.min(displayCount, filters.filteredLogs.length)} of {filters.filteredLogs.length} logs
          </div>
        </div>

        {/* Logs Display - TODO: Extract to LogTable and LogCards components */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            รายการ Logs
          </h2>

          {/* Table/Cards would go here */}
          <div className="space-y-2">
            {filters.filteredLogs.slice(0, displayCount).map((log) => (
              <div key={log.id} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{log.answer}</div>
                    <div className="text-sm text-gray-600">
                      Number: {log.number} | Question: {questions[log.questionId]}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => actions.openEditModal(log.id, log.answer)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => actions.setDeleteConfirm({ logId: log.id, answer: log.answer })}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Buttons */}
          {displayCount < filters.filteredLogs.length && (
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                โหลดเพิ่มเติม ({LOAD_MORE_COUNT} รายการ)
              </button>
              <button
                onClick={() => setDisplayCount(filters.filteredLogs.length)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                โหลดทั้งหมด ({filters.filteredLogs.length} รายการ)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditAnswerModal
        isOpen={!!actions.editingLog}
        currentAnswer={actions.editingLog?.currentAnswer || ""}
        editedAnswer={actions.editedAnswer}
        isUpdating={actions.isUpdating}
        onClose={actions.closeEditModal}
        onSubmit={actions.handleEditAnswer}
        onAnswerChange={actions.setEditedAnswer}
      />

      <DeleteConfirmModal
        isOpen={!!actions.deleteConfirm}
        answer={actions.deleteConfirm?.answer || ""}
        isDeleting={actions.isDeleting}
        onClose={() => actions.setDeleteConfirm(null)}
        onConfirm={() => actions.handleDeleteLogs([actions.deleteConfirm!.logId])}
      />

      <DeleteTestLogsModal
        isOpen={actions.showDeleteTestConfirm}
        testLogsCount={testLogsCount}
        isDeleting={actions.isDeletingTest}
        onClose={() => actions.setShowDeleteTestConfirm(false)}
        onConfirm={actions.handleDeleteAllTestLogs}
      />
    </div>
  );
}
