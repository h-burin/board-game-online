"use client";

import Link from "next/link";
import RotatingText from "@/components/reactbits/RotatingText";
import { FaPlus, FaPeopleGroup } from "react-icons/fa6";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* Logo/Title Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center text-5xl md:text-6xl lg:text-7xl mb-4">
              <span className="text-white font-bold mr-3">Board</span>
              <RotatingText
                texts={["Game!", "Crew!", "Fun!", "COOL!"]}
                mainClassName="px-4 md:px-6 bg-white text-black overflow-hidden justify-center rounded-2xl font-bold"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                rotationInterval={2000}
              />
            </div>
            <p className="text-xl md:text-2xl text-purple-200 mt-4">
              เล่นบอร์ดเกมออนไลน์กับเพื่อนๆ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/create-room"
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 no-underline"
            >
              <FaPlus className="text-2xl" />
              <span>สร้างห้อง</span>
            </Link>

            <Link
              href="/join-room"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-xl font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 no-underline"
            >
              <FaPeopleGroup className="text-2xl" />
              <span>เข้าร่วมห้อง</span>
            </Link>
          </div>

          {/* Info Section */}
          <div className="mt-10 bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
            <div className="text-sm text-purple-100 text-center">
              <p className="font-semibold mb-1">วิธีเล่น</p>
              <p className="m-0">สร้างห้องใหม่เพื่อเริ่มเกม หรือใส่รหัสห้องเพื่อเข้าร่วมกับเพื่อนๆ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
