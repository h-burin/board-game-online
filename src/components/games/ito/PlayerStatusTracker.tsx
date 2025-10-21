/**
 * Player Status Tracker Component
 * แสดงสถานะการส่งคำใบ้ของผู้เล่น
 */

"use client";

interface PlayerStatus {
  playerName: string;
  submittedCount: number;
  totalExpected: number;
}

interface PlayerStatusTrackerProps {
  title: string;
  playersCompleted: PlayerStatus[];
  playersNotCompleted: Array<[string, PlayerStatus]>;
  totalPlayers: number;
}

export default function PlayerStatusTracker({
  title,
  playersCompleted,
  playersNotCompleted,
  totalPlayers,
}: PlayerStatusTrackerProps) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
      <h4 className="text-white font-bold mb-3 text-center">{title}</h4>
      <div className="text-center text-white/70 mb-3">
        {playersCompleted.length} / {totalPlayers} คนส่งครบแล้ว
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* ส่งครบแล้ว */}
        <div>
          <div className="text-green-400 text-sm mb-2 text-center">
            ✅ ส่งครบแล้ว
          </div>
          <div className="space-y-1">
            {playersCompleted.map((p, i) => (
              <div
                key={i}
                className="text-white/80 text-sm text-center bg-green-500/20 rounded py-1"
              >
                {p.playerName} ({p.submittedCount}/{p.totalExpected})
              </div>
            ))}
          </div>
        </div>

        {/* ยังส่งไม่ครบ */}
        <div>
          <div className="text-orange-400 text-sm mb-2 text-center">
            ⏳ ยังส่งไม่ครบ
          </div>
          <div className="space-y-1">
            {playersNotCompleted.map(([id, p]) => (
              <div
                key={id}
                className="text-white/50 text-sm text-center bg-orange-500/20 rounded py-1"
              >
                {p.playerName} ({p.submittedCount}/{p.totalExpected})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
