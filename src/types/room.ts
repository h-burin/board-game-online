/**
 * Room Types
 * ประเภทข้อมูลสำหรับห้องเกม
 */

export interface Room {
  id: string;
  code: string; // 6-digit room code
  gameId: string; // Reference to games collection
  gameType?: string; // Game name for display
  gameSessionId?: string; // Reference to game_sessions collection
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  currentPlayers: number;
  timeLimit?: number; // Time limit in minutes (optional, depends on game)
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
