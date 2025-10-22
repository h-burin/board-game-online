/**
 * Game Types
 * ประเภทข้อมูลสำหรับเกม
 */

export interface Game {
  id: string;
  name: string;
  minPlayer: number;
  maxPlayer: number;
  description?: string;
  imageUrl?: string;
  defaultTimeMinutes?: number; // Default time limit in minutes (optional)
  enableCustomTime?: boolean; // Whether this game allows custom time limit
  createdAt?: Date;
  updatedAt?: Date;
}
