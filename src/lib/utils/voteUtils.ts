/**
 * Vote Utility Functions
 * Pure functions for vote-related operations
 */

import type { ItoPlayerAnswer, ItoVote } from '@/types/ito';

/**
 * Parse answerId string to components
 * @param answerId Format: "playerId_answerIndex"
 * @returns Object with playerId and answerIndex
 */
export function parseAnswerId(answerId: string): {
  playerId: string;
  answerIndex: number;
} {
  const [playerId, answerIndexStr] = answerId.split('_');
  return {
    playerId,
    answerIndex: parseInt(answerIndexStr, 10),
  };
}

/**
 * Create answerId string from components
 */
export function createAnswerId(playerId: string, answerIndex: number): string {
  return `${playerId}_${answerIndex}`;
}

/**
 * Find current player's vote
 */
export function findMyVote(
  votes: ItoVote[],
  playerId: string
): ItoVote | undefined {
  return votes.find((v) => v.playerId === playerId);
}

/**
 * Get voters for a specific answer
 */
export function getVotersForAnswer(
  votes: ItoVote[],
  targetPlayerId: string,
  targetAnswerIndex: number
): ItoVote[] {
  return votes.filter(
    (v) =>
      v.votedForPlayerId === targetPlayerId &&
      v.votedForAnswerIndex === targetAnswerIndex
  );
}

/**
 * Get voter names for a specific answer
 */
export function getVoterNames(
  votes: ItoVote[],
  playerAnswers: ItoPlayerAnswer[],
  targetPlayerId: string,
  targetAnswerIndex: number
): string[] {
  const votersForAnswer = getVotersForAnswer(
    votes,
    targetPlayerId,
    targetAnswerIndex
  );

  return votersForAnswer
    .map((vote) => {
      const voter = playerAnswers.find((a) => a.playerId === vote.playerId);
      return voter?.playerName || 'Unknown';
    })
    .filter((name, index, self) => self.indexOf(name) === index); // unique names
}

/**
 * Check if all players have voted
 */
export function hasAllPlayersVoted(
  voteCount: number,
  playerAnswers: ItoPlayerAnswer[]
): boolean {
  const uniquePlayerIds = Array.from(
    new Set(playerAnswers.map((a) => a.playerId))
  );
  return voteCount === uniquePlayerIds.length && voteCount > 0;
}

/**
 * Restore vote selection from votes data
 */
export function restoreVoteSelection(
  votes: ItoVote[],
  playerId: string
): string | null {
  const myVote = findMyVote(votes, playerId);

  if (!myVote) return null;

  return createAnswerId(myVote.votedForPlayerId, myVote.votedForAnswerIndex);
}
