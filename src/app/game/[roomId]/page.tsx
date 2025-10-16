/**
 * หน้าเล่นเกม
 * แสดงเกมที่เลือกและจัดการ gameplay
 * Dynamic route: /game/[roomId]
 */

interface GamePageProps {
  params: {
    roomId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  return <div>Game Room: {params.roomId}</div>;
}
