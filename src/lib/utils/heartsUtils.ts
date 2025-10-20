/**
 * Hearts Display Utility Functions
 * Calculate correct hearts to display based on game phase and status
 */

import type { ItoGameState } from '@/types/ito';

interface RevealResult {
  isCorrect: boolean;
  heartsLost: number;
  newHearts: number;
}

/**
 * Calculate current hearts to display
 * Handles different phases and edge cases
 */
export function calculateCurrentHearts(
  gameState: ItoGameState,
  lastRevealResult: RevealResult | null
): number {
  // Finished phase with lost status: always show 0 hearts
  if (gameState.phase === 'finished' && gameState.status === 'lost') {
    return 0;
  }

  // Reveal phase: use newHearts from API to avoid timing issues
  if (gameState.phase === 'reveal' && lastRevealResult) {
    return lastRevealResult.newHearts;
  }

  // Default: use hearts from gameState
  return gameState.hearts;
}

/**
 * Generate hearts display string (e.g., "❤️❤️❤️" or "❤️💔💔")
 */
export function renderHeartsDisplay(
  currentHearts: number,
  maxHearts: number = 3
): string {
  const fullHearts = '❤️'.repeat(currentHearts);
  const emptyHearts = '💔'.repeat(maxHearts - currentHearts);
  return fullHearts + emptyHearts;
}

/**
 * Check if game is lost (no hearts remaining)
 */
export function isGameLost(hearts: number): boolean {
  return hearts <= 0;
}

/**
 * Check if game is won (completed all levels with hearts remaining)
 */
export function isGameWon(
  currentLevel: number,
  totalLevels: number,
  hearts: number
): boolean {
  return currentLevel > totalLevels && hearts > 0;
}
