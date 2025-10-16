/**
 * Room Types
 * ประเภทข้อมูลสำหรับห้องเกม
 */

export interface Room {
  id: string;
  code: string; // 6-digit room code
  gameType?: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  currentPlayers: number;
  gameId?: string; // Reference to game document when playing
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomInput {
  hostName: string;
  gameType?: string;
  maxPlayers?: number;
}

export interface JoinRoomInput {
  roomCode: string;
  playerName: string;
}
