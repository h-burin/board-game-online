/**
 * ITO Game Constants
 * Central location for all ITO game-related constants
 */

export const ITO_GAME_CONFIG = {
  MAX_HEARTS: 3,
  MIN_NUMBER: 1,
  MAX_NUMBER: 100,
  TIMER_DURATION: 60, // seconds
} as const;

export const ITO_PHASES = {
  WRITING: 'writing',
  VOTING: 'voting',
  REVEAL: 'reveal',
  FINISHED: 'finished',
} as const;

export const ITO_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
} as const;

export const STATUS_TABS = {
  HINTS: 'hints',
  VOTES: 'votes',
} as const;

export type ItoPhase = typeof ITO_PHASES[keyof typeof ITO_PHASES];
export type ItoStatus = typeof ITO_STATUS[keyof typeof ITO_STATUS];
export type StatusTab = typeof STATUS_TABS[keyof typeof STATUS_TABS];
