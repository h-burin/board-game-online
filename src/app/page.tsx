"use client";

import { useState } from "react";
import Link from "next/link";
import { FaPlus, FaPeopleGroup, FaDice, FaGamepad, FaComments } from "react-icons/fa6";
import FeedbackModal from "@/components/FeedbackModal";

export default function Home() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-12 border border-white/20">
          {/* Logo/Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 shadow-lg">
              <FaGamepad className="text-3xl md:text-4xl text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
              บอร์ดเกม
            </h1>
            <p className="text-base md:text-xl text-slate-300">เล่นบอร์ดเกมออนไลน์กับเพื่อนๆ</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
            <Link
              href="/create-room"
              className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg md:text-xl font-bold py-5 md:py-6 px-6 md:px-8 rounded-2xl transition-all transform hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center gap-2 md:gap-3 no-underline"
            >
              <FaPlus className="text-3xl md:text-4xl group-hover:rotate-90 transition-transform duration-300" />
              <span>สร้างห้องเกม</span>
              <span className="text-xs md:text-sm font-normal text-green-100 opacity-90">เริ่มเกมใหม่</span>
            </Link>

            <Link
              href="/join-room"
              className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-lg md:text-xl font-bold py-5 md:py-6 px-6 md:px-8 rounded-2xl transition-all transform hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center gap-2 md:gap-3 no-underline"
            >
              <FaPeopleGroup className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300" />
              <span>เข้าร่วมห้อง</span>
              <span className="text-xs md:text-sm font-normal text-blue-100 opacity-90">ใช้รหัสห้อง</span>
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center border border-white/10">
              <FaDice className="text-2xl md:text-3xl text-blue-400 mx-auto mb-1 md:mb-2" />
              <p className="text-white font-semibold text-sm md:text-base mb-1">หลากหลายเกม</p>
              <p className="text-slate-300 text-xs md:text-sm">เลือกเกมที่ชอบ</p>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-white/5 hover:bg-white/10 rounded-xl p-3 md:p-4 text-center border border-white/10 hover:border-white/30 transition-all transform hover:scale-105 cursor-pointer"
            >
              <FaComments className="text-2xl md:text-3xl text-yellow-400 mx-auto mb-1 md:mb-2" />
              <p className="text-white font-semibold text-sm md:text-base mb-1">ช่วยปรับปรุง</p>
              <p className="text-slate-300 text-xs md:text-sm">แจ้งปัญหา/เพิ่มโจทย์</p>
            </button>
            <div className="bg-white/5 rounded-xl p-3 md:p-4 text-center border border-white/10">
              <FaGamepad className="text-2xl md:text-3xl text-purple-400 mx-auto mb-1 md:mb-2" />
              <p className="text-white font-semibold text-sm md:text-base mb-1">เล่นง่าย</p>
              <p className="text-slate-300 text-xs md:text-sm">ไม่ต้องติดตั้ง</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 md:p-4">
            <div className="text-xs md:text-sm text-slate-200 text-center">
              <span className="font-semibold">💡 วิธีเล่น: </span>
              <span>
                สร้างห้องใหม่เพื่อเริ่มเกม หรือใส่รหัสห้อง 6 หลักเพื่อเข้าร่วมกับเพื่อนๆ
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-xs md:text-sm">
          <p>เล่นได้ฟรี ไม่มีค่าใช้จ่าย</p>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </div>
  );
}
