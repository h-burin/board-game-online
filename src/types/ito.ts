/**
 * ITO Game Types
 * iTo - เรียงลำดับตัวเลขโดยการสื่อสาร
 */

// Phase ของเกม
export type ItoGamePhase =
  | 'waiting'      // รอเริ่มเกม
  | 'writing'      // ผู้เล่นพิมพ์คำใบ้
  | 'voting'       // ผู้เล่นโหวตเลือกคำใบ้ที่น้อยที่สุด
  | 'reveal'       // เปิดเผยผลและตัวเลข
  | 'finished';    // เกมจบ

// สถานะของ Player Answer
export interface ItoPlayerAnswer {
  playerId: string;
  playerName: string;
  number: number;           // เลข 1-100 ที่ player คนนี้ได้
  answer: string;           // คำใบ้ที่พิมพ์
  submittedAt?: Date;       // เวลาที่ส่งคำตอบ
  isRevealed: boolean;      // เปิดเผยแล้วหรือยัง
}

// Vote ของแต่ละคน
export interface ItoVote {
  playerId: string;
  votedForPlayerId: string; // โหวตให้ player ไหน
  votedAt: Date;
}

// Game State หลัก
export interface ItoGameState {
  id: string;
  roomId: string;
  gameId: string;           // BWLxJkh45e6RiALRBmcl

  // Game Progress
  hearts: number;           // หัวใจที่เหลือ (เริ่มต้น 3)
  currentRound: number;     // รอบปัจจุบัน (1-based)
  totalRounds: number;      // จำนวนรอบทั้งหมด = จำนวนผู้เล่น

  // Question
  questionId: string;       // ID ของโจทย์จาก ito_questions
  questionText: string;     // โจทย์ (เก็บไว้เพื่อความสะดวก)

  // Phase Management
  phase: ItoGamePhase;
  phaseEndTime?: Date;      // เวลาที่ phase จะจบ (สำหรับจับเวลา)

  // Revealed Numbers (เลขที่ถูกเปิดเผยแล้ว - เรียงจากน้อยไปมาก)
  revealedNumbers: number[];

  // Game Result
  status: 'playing' | 'won' | 'lost';

  // Timestamps
  startedAt: Date;
  updatedAt: Date;
}

// Question จาก ito_questions collection
export interface ItoQuestion {
  id: string;
  questionsTH: string;      // โจทย์ภาษาไทย
  // อาจจะมี field อื่นๆ เพิ่มในอนาคต เช่น
  // questionsEN?: string;
  // category?: string;
  // difficulty?: string;
}

// Response สำหรับ API
export interface StartItoGameResponse {
  success: boolean;
  gameState?: ItoGameState;
  playerAnswers?: ItoPlayerAnswer[];
  error?: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  error?: string;
}

export interface SubmitVoteResponse {
  success: boolean;
  error?: string;
}

// Helper Types
export interface VoteResult {
  playerId: string;
  playerName: string;
  voteCount: number;
  number: number;
  answer: string;
}
