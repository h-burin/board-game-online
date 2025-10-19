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
  createdAt?: Date;
  updatedAt?: Date;
}
