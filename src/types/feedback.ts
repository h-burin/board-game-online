/**
 * Feedback Types
 * ประเภทของ feedback และโครงสร้างข้อมูล
 */

import { Timestamp } from 'firebase/firestore';

export type FeedbackType = 'issue' | 'improvement';

export interface Feedback {
  id?: string;
  type: FeedbackType;
  gameId: string;
  gameName: string;
  subject: string;
  description: string;
  createdAt?: Timestamp;
  status?: 'pending' | 'reviewed' | 'resolved';
}

export interface SuggestedItoQuestion {
  questionsTH: string;
  isActive: boolean;
  createdBy: string;
  createdAt?: Timestamp;
}
