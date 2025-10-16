/**
 * Player Types
 * ประเภทข้อมูลสำหรับผู้เล่น
 */

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  joinedAt: Date;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  score: number;
  rank?: number;
}
