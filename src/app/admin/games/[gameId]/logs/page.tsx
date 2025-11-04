"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useItoGameLogs, useItoQuestions } from "@/lib/hooks/useItoGameLogs";
import { useAdminActivity } from "@/lib/hooks/useAdminActivity";
import { deleteGameLogs } from "@/lib/firebase/ito";

export default function ItoGameLogsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameName, setGameName] = useState<string>("Game");
  const { logs, loading: logsLoading } = useItoGameLogs();
  const { questions, loading: questionsLoading } = useItoQuestions();

  // Filters
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("all");
  const [selectedNumberRange, setSelectedNumberRange] = useState<string>("all");
  const [selectedEditStatus, setSelectedEditStatus] = useState<string>("all");
  const [selectedTestStatus, setSelectedTestStatus] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Question autocomplete
  const [questionSearchTerm, setQuestionSearchTerm] = useState<string>("");
  const [showQuestionDropdown, setShowQuestionDropdown] = useState<boolean>(false);
  const questionDropdownRef = useRef<HTMLDivElement>(null);

  // Expanded question for drill-down
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null
  );

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    logId: string;
    answer: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useAdminActivity();

  // Handle delete logs (bulk delete)
  const handleDeleteLogs = async (logIds: string[]) => {
    setIsDeleting(true);
    try {
      const success = await deleteGameLogs(logIds);
      if (success) {
        console.log('✅ Logs deleted successfully');
        setDeleteConfirm(null);
      } else {
        alert('เกิดข้อผิดพลาดในการลบ log');
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      alert('เกิดข้อผิดพลาดในการลบ log');
    } finally {
      setIsDeleting(false);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        questionDropdownRef.current &&
        !questionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowQuestionDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/admin/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load game name
  useEffect(() => {
    if (!gameId) return;

    const loadGameName = async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (gameDoc.exists()) {
          setGameName(gameDoc.data().name || 'Game');
        }
      } catch (error) {
        console.error('Error loading game name:', error);
      }
    };

    loadGameName();
  }, [gameId]);

  // Filtered questions for autocomplete
  const filteredQuestions = useMemo(() => {
    if (!questionSearchTerm) return Object.entries(questions);

    const search = questionSearchTerm.toLowerCase();
    return Object.entries(questions).filter(([, text]) =>
      text.toLowerCase().includes(search)
    );
  }, [questions, questionSearchTerm]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedAgeRange !== "all" && log.ageRange !== selectedAgeRange) {
        return false;
      }
      if (selectedQuestion !== "all" && log.questionId !== selectedQuestion) {
        return false;
      }
      if (selectedNumberRange !== "all") {
        const num = log.number;
        if (selectedNumberRange === "1-25" && (num < 1 || num > 25))
          return false;
        if (selectedNumberRange === "26-50" && (num < 26 || num > 50))
          return false;
        if (selectedNumberRange === "51-75" && (num < 51 || num > 75))
          return false;
        if (selectedNumberRange === "76-100" && (num < 76 || num > 100))
          return false;
      }
      if (selectedEditStatus !== "all") {
        if (selectedEditStatus === "original" && log.isEdited) return false;
        if (selectedEditStatus === "edited" && !log.isEdited) return false;
      }
      if (selectedTestStatus !== "all") {
        if (selectedTestStatus === "real" && log.isTest) return false;
        if (selectedTestStatus === "test" && !log.isTest) return false;
      }

      // Date filter
      if (selectedDateRange !== "all" || customStartDate || customEndDate) {
        const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.createdAt);
        const now = new Date();

        if (selectedDateRange === "today") {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (logDate < today) return false;
        } else if (selectedDateRange === "yesterday") {
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (logDate < yesterday || logDate >= today) return false;
        } else if (selectedDateRange === "last7days") {
          const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < last7days) return false;
        } else if (selectedDateRange === "last30days") {
          const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < last30days) return false;
        } else if (selectedDateRange === "thisWeek") {
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          if (logDate < firstDayOfWeek) return false;
        } else if (selectedDateRange === "thisMonth") {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (logDate < firstDayOfMonth) return false;
        } else if (selectedDateRange === "custom") {
          if (customStartDate) {
            const startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            if (logDate < startDate) return false;
          }
          if (customEndDate) {
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            if (logDate > endDate) return false;
          }
        }
      }

      return true;
    });
  }, [logs, selectedAgeRange, selectedQuestion, selectedNumberRange, selectedEditStatus, selectedTestStatus, selectedDateRange, customStartDate, customEndDate]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (filteredLogs.length === 0) return null;

    // 1. จำนวนคำตอบทั้งหมด
    const totalAnswers = filteredLogs.length;

    // 2. แจกแจงตามช่วงอายุ
    const byAgeRange: { [key: string]: number } = {};
    filteredLogs.forEach((log) => {
      const age = log.ageRange || "ไม่ระบุ";
      byAgeRange[age] = (byAgeRange[age] || 0) + 1;
    });

    // 3. แจกแจงตามโจทย์ พร้อมข้อมูล drill-down
    const byQuestion: {
      [key: string]: {
        count: number;
        answers: string[];
        answerDetails: Array<{
          logId: string;
          answer: string;
          ageRange: string | null;
          number: number;
          isEdited: boolean;
          previousAnswer: string | null;
          isTest: boolean;
        }>;
      };
    } = {};
    filteredLogs.forEach((log) => {
      if (!byQuestion[log.questionId]) {
        byQuestion[log.questionId] = {
          count: 0,
          answers: [],
          answerDetails: [],
        };
      }
      byQuestion[log.questionId].count++;
      byQuestion[log.questionId].answers.push(log.answer);
      byQuestion[log.questionId].answerDetails.push({
        logId: log.id,
        answer: log.answer,
        ageRange: log.ageRange,
        number: log.number,
        isEdited: log.isEdited,
        previousAnswer: log.previousAnswer,
        isTest: log.isTest,
      });
    });

    // 4. ความสัมพันธ์ระหว่างเลขกับคำตอบ (แบ่งเป็น 4 กลุ่ม)
    const byNumberRange: {
      [key: string]: { count: number; avgAnswerLength: number };
    } = {
      "1-25": { count: 0, avgAnswerLength: 0 },
      "26-50": { count: 0, avgAnswerLength: 0 },
      "51-75": { count: 0, avgAnswerLength: 0 },
      "76-100": { count: 0, avgAnswerLength: 0 },
    };

    filteredLogs.forEach((log) => {
      const num = log.number;
      let range = "";
      if (num >= 1 && num <= 25) range = "1-25";
      else if (num >= 26 && num <= 50) range = "26-50";
      else if (num >= 51 && num <= 75) range = "51-75";
      else if (num >= 76 && num <= 100) range = "76-100";

      if (range) {
        byNumberRange[range].count++;
        byNumberRange[range].avgAnswerLength += log.answer.length;
      }
    });

    // คำนวณค่าเฉลี่ย
    Object.keys(byNumberRange).forEach((range) => {
      if (byNumberRange[range].count > 0) {
        byNumberRange[range].avgAnswerLength = Math.round(
          byNumberRange[range].avgAnswerLength / byNumberRange[range].count
        );
      }
    });

    // 5. คำตอบยอดนิยม (Top 10)
    const answerFrequency: { [key: string]: number } = {};
    filteredLogs.forEach((log) => {
      const answer = log.answer.toLowerCase().trim();
      answerFrequency[answer] = (answerFrequency[answer] || 0) + 1;
    });

    const topAnswers = Object.entries(answerFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([answer, count]) => ({ answer, count }));

    // 6. ความหลากหลายของคำตอบในแต่ละโจทย์
    const questionDiversity: { [key: string]: number } = {};
    Object.entries(byQuestion).forEach(([qId, data]) => {
      const uniqueAnswers = new Set(
        data.answers.map((a) => a.toLowerCase().trim())
      ).size;
      questionDiversity[qId] = Math.round((uniqueAnswers / data.count) * 100);
    });

    // 7. สถิติการแก้ไขคำตอบ
    const editStats = {
      totalEdited: filteredLogs.filter((log) => log.isEdited).length,
      totalOriginal: filteredLogs.filter((log) => !log.isEdited).length,
      editPercentage: Math.round(
        (filteredLogs.filter((log) => log.isEdited).length / totalAnswers) * 100
      ),
    };

    // 8. สถิติคำตอบทดสอบ
    const testStats = {
      totalTest: filteredLogs.filter((log) => log.isTest).length,
      totalReal: filteredLogs.filter((log) => !log.isTest).length,
      testPercentage: Math.round(
        (filteredLogs.filter((log) => log.isTest).length / totalAnswers) * 100
      ),
    };

    return {
      totalAnswers,
      byAgeRange,
      byQuestion,
      byNumberRange,
      topAnswers,
      questionDiversity,
      editStats,
      testStats,
    };
  }, [filteredLogs]);

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
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
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
        {/* Filters */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            ตัวกรองข้อมูล
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Age Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงอายุ
              </label>
              <select
                value={selectedAgeRange}
                onChange={(e) => setSelectedAgeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="0-17">0-17 ปี</option>
                <option value="18-24">18-24 ปี</option>
                <option value="25-34">25-34 ปี</option>
                <option value="35-44">35-44 ปี</option>
                <option value="45-54">45-54 ปี</option>
                <option value="55+">55+ ปี</option>
                <option value="ไม่ระบุ">ไม่ระบุ</option>
              </select>
            </div>

            {/* Question Filter - Autocomplete */}
            <div className="relative" ref={questionDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โจทย์
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    selectedQuestion === "all"
                      ? questionSearchTerm
                      : questions[selectedQuestion] || ""
                  }
                  onChange={(e) => {
                    setQuestionSearchTerm(e.target.value);
                    setSelectedQuestion("all");
                    setShowQuestionDropdown(true);
                  }}
                  onFocus={() => setShowQuestionDropdown(true)}
                  placeholder="พิมพ์เพื่อค้นหาโจทย์..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {(selectedQuestion !== "all" || questionSearchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedQuestion("all");
                      setQuestionSearchTerm("");
                      setShowQuestionDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showQuestionDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setSelectedQuestion("all");
                      setQuestionSearchTerm("");
                      setShowQuestionDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-200 font-medium"
                  >
                    ทั้งหมด
                  </div>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map(([id, text]) => (
                      <div
                        key={id}
                        onClick={() => {
                          setSelectedQuestion(id);
                          setQuestionSearchTerm("");
                          setShowQuestionDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm text-gray-900">{text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      ไม่พบโจทย์ที่ตรงกับคำค้นหา
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Number Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเลข
              </label>
              <select
                value={selectedNumberRange}
                onChange={(e) => setSelectedNumberRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="1-25">1-25</option>
                <option value="26-50">26-50</option>
                <option value="51-75">51-75</option>
                <option value="76-100">76-100</option>
              </select>
            </div>

            {/* Edit Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะการแก้ไข
              </label>
              <select
                value={selectedEditStatus}
                onChange={(e) => setSelectedEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="original">คำตอบแรก</option>
                <option value="edited">แก้ไขแล้ว</option>
              </select>
            </div>

            {/* Test Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทคำตอบ
              </label>
              <select
                value={selectedTestStatus}
                onChange={(e) => setSelectedTestStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="real">คำตอบจริง</option>
                <option value="test">คำตอบทดสอบ</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลา
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="today">วันนี้</option>
                <option value="yesterday">เมื่อวาน</option>
                <option value="last7days">7 วันที่แล้ว</option>
                <option value="last30days">30 วันที่แล้ว</option>
                <option value="thisWeek">สัปดาห์นี้</option>
                <option value="thisMonth">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {selectedDateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จากวันที่
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Reset Filters */}
          {(selectedAgeRange !== "all" ||
            selectedQuestion !== "all" ||
            selectedNumberRange !== "all" ||
            selectedEditStatus !== "all" ||
            selectedTestStatus !== "all" ||
            selectedDateRange !== "all" ||
            customStartDate ||
            customEndDate ||
            questionSearchTerm) && (
            <button
              onClick={() => {
                setSelectedAgeRange("all");
                setSelectedQuestion("all");
                setSelectedNumberRange("all");
                setSelectedEditStatus("all");
                setSelectedTestStatus("all");
                setSelectedDateRange("all");
                setCustomStartDate("");
                setCustomEndDate("");
                setQuestionSearchTerm("");
                setShowQuestionDropdown(false);
              }}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {!analytics ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600">ยังไม่มีข้อมูล Game Logs</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white/80 text-sm">จำนวนคำตอบทั้งหมด</p>
                  <p className="text-4xl font-bold">
                    {analytics.totalAnswers.toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Edit Stats Mini Cards */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">คำตอบแรก</p>
                  <p className="text-2xl font-bold">{analytics.editStats.totalOriginal}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">แก้ไขแล้ว</p>
                  <p className="text-2xl font-bold">{analytics.editStats.totalEdited}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">% แก้ไข</p>
                  <p className="text-2xl font-bold">{analytics.editStats.editPercentage}%</p>
                </div>
              </div>
              {/* Test Stats Mini Cards */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">คำตอบจริง</p>
                  <p className="text-2xl font-bold">{analytics.testStats.totalReal}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">คำตอบทดสอบ</p>
                  <p className="text-2xl font-bold">{analytics.testStats.totalTest}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <p className="text-white/70 text-xs">% ทดสอบ</p>
                  <p className="text-2xl font-bold">{analytics.testStats.testPercentage}%</p>
                </div>
              </div>
            </div>

            {/* By Age Range */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                แจกแจงตามช่วงอายุ
              </h2>
              <div className="space-y-3">
                {Object.entries(analytics.byAgeRange)
                  .sort(([, a], [, b]) => b - a)
                  .map(([age, count]) => {
                    const percentage = (
                      (count / analytics.totalAnswers) *
                      100
                    ).toFixed(1);
                    return (
                      <div key={age}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {age}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} คำตอบ ({percentage}%)
                          </span>
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

            {/* By Question with Drill-down */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">❓</span>
                แจกแจงตามโจทย์
              </h2>
              <div className="space-y-4">
                {Object.entries(analytics.byQuestion)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([qId, data]) => {
                    const questionText = questions[qId] || "ไม่พบโจทย์";
                    const diversity = analytics.questionDiversity[qId] || 0;
                    const percentage = (
                      (data.count / analytics.totalAnswers) *
                      100
                    ).toFixed(1);
                    const isExpanded = expandedQuestionId === qId;

                    // Group answers by answer text with age ranges and edit info
                    const answerGroups: {
                      [answer: string]: Array<{
                        logId: string;
                        ageRange: string | null;
                        number: number;
                        isEdited: boolean;
                        previousAnswer: string | null;
                        isTest: boolean;
                      }>;
                    } = {};
                    data.answerDetails.forEach((detail) => {
                      const answerKey = detail.answer.toLowerCase().trim();
                      if (!answerGroups[answerKey]) {
                        answerGroups[answerKey] = [];
                      }
                      answerGroups[answerKey].push({
                        logId: detail.logId,
                        ageRange: detail.ageRange,
                        number: detail.number,
                        isEdited: detail.isEdited,
                        previousAnswer: detail.previousAnswer,
                        isTest: detail.isTest,
                      });
                    });

                    return (
                      <div
                        key={qId}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedQuestionId(isExpanded ? null : qId)
                          }
                          className="w-full border-l-4 border-blue-500 pl-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900 flex-1 pr-4">
                                  {questionText}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{percentage}% ของทั้งหมด</span>
                                <span>•</span>
                                <span>ความหลากหลาย: {diversity}%</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 me-4">
                              <span className="text-sm text-gray-600">
                                {data.count} คำตอบ
                              </span>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              คำตอบทั้งหมด:
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {Object.entries(answerGroups)
                                .sort(([, a], [, b]) => b.length - a.length)
                                .map(([answer, details], idx) => {
                                  // Group by age range
                                  const ageGroups: { [age: string]: number } =
                                    {};
                                  details.forEach((d) => {
                                    const age = d.ageRange || "ไม่ระบุ";
                                    ageGroups[age] = (ageGroups[age] || 0) + 1;
                                  });

                                  // Calculate average number for this answer
                                  const avgNumber = Math.round(
                                    details.reduce(
                                      (sum, d) => sum + d.number,
                                      0
                                    ) / details.length
                                  );

                                  // Get number range
                                  const numbers = details
                                    .map((d) => d.number)
                                    .sort((a, b) => a - b);
                                  const minNumber = numbers[0];
                                  const maxNumber = numbers[numbers.length - 1];

                                  // Check for edits
                                  const editedCount = details.filter((d) => d.isEdited).length;
                                  const hasEdits = editedCount > 0;

                                  // Group previous answers if edited
                                  const previousAnswers = new Set(
                                    details
                                      .filter((d) => d.isEdited && d.previousAnswer)
                                      .map((d) => d.previousAnswer!)
                                  );

                                  // Check for test answers
                                  const testCount = details.filter((d) => d.isTest).length;
                                  const hasTestAnswers = testCount > 0;

                                  // Get all log IDs for this answer
                                  const logIds = details.map(d => d.logId);

                                  return (
                                    <div
                                      key={idx}
                                      className={`bg-white rounded-lg p-4 border-2 ${
                                        hasEdits ? "border-orange-300" : "border-gray-200"
                                      } relative`}
                                    >
                                      {/* Delete Button - Top Right */}
                                      <button
                                        onClick={() => setDeleteConfirm({
                                          logId: logIds.join(','), // Store multiple IDs
                                          answer: answer
                                        })}
                                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title={`ลบคำตอบ "${answer}" (${details.length} ครั้ง)`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>

                                      {/* Answer Text */}
                                      <div className="text-center mb-3 pr-8">
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                          <p className="text-base font-semibold text-gray-900">
                                            &quot;{answer}&quot;
                                          </p>
                                          {hasEdits && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                              แก้ไข {editedCount}x
                                            </span>
                                          )}
                                          {hasTestAnswers && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                              ทดสอบ {testCount}x
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                          ถูกใช้ {details.length} ครั้ง
                                        </p>
                                        {/* Show previous answers if edited */}
                                        {hasEdits && previousAnswers.size > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <span className="font-medium">แก้ไขจาก:</span>{" "}
                                            {Array.from(previousAnswers).map((prev, i) => (
                                              <span key={i}>
                                                {i > 0 && ", "}
                                                <span className="italic">&quot;{prev}&quot;</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Stats Grid - 3 columns */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Age Ranges */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                          <p className="text-xs text-gray-600 mb-2 text-center">
                                            ช่วงอายุ
                                          </p>
                                          <div className="flex flex-wrap gap-1 justify-center">
                                            {Object.entries(ageGroups)
                                              .sort(([, a], [, b]) => b - a)
                                              .map(([age, count]) => (
                                                <span
                                                  key={age}
                                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                  {age}: {count}
                                                </span>
                                              ))}
                                          </div>
                                        </div>

                                        {/* Number Range */}
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                          <p className="text-xs text-gray-600 mb-1">
                                            เลขที่ได้
                                          </p>
                                          <p className="text-lg font-bold text-gray-900">
                                            {minNumber}
                                            {minNumber !== maxNumber
                                              ? `-${maxNumber}`
                                              : ""}
                                          </p>
                                        </div>

                                        {/* Average Number */}
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                          <p className="text-xs text-gray-600 mb-1">
                                            เลขเฉลี่ย
                                          </p>
                                          <p className="text-lg font-bold text-gray-900">
                                            {avgNumber}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* By Number Range */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔢</span>
                ความสัมพันธ์ระหว่างเลขกับคำตอบ
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.byNumberRange).map(
                  ([range, data]) => (
                    <div
                      key={range}
                      className="bg-gray-50 rounded-lg p-4 text-center"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        เลข {range}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {data.count}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        ความยาวเฉลี่ย: {data.avgAnswerLength} ตัวอักษร
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Top Answers */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                คำตอบยอดนิยม (Top 10)
              </h2>
              <div className="space-y-3">
                {analytics.topAnswers.map((item, index) => {
                  const percentage = (
                    (item.count / analytics.totalAnswers) *
                    100
                  ).toFixed(1);
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.answer}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.count} ครั้ง ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบ</h3>
                <p className="text-sm text-gray-600">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                คุณต้องการลบคำตอบ:
              </p>
              <p className="text-base font-semibold text-gray-900 mb-2">
                &quot;{deleteConfirm.answer}&quot;
              </p>
              <p className="text-xs text-red-600">
                จำนวน {deleteConfirm.logId.split(',').length} log จะถูกลบ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  const logIds = deleteConfirm.logId.split(',');
                  handleDeleteLogs(logIds);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังลบ...
                  </>
                ) : (
                  'ลบ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
