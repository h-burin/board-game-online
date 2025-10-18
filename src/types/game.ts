/**
 * Game Types
 * ประเภทข้อมูลสำหรับเกม
 */

export interface Game {
  id: string;
  name: string;
  MinPlayer: number;
  MaxPlayer: number;
  description?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
