export type GameMode = 'easy' | 'hard' | 'crazy' | 'impossible';

export type GameModeConfig = {
  label: string;
  description: string;
  bannerDurationMs: number;
  decoyLetterCount: number;
  hintAllowed: boolean;
  /** Whether the honey pot wanders around the field instead of only jumping between rounds. */
  potDriftEnabled: boolean;
  /** Starting wander range (px) — how far the pot can drift from its current spot right after it appears. */
  potDriftRangePx: number;
  /** Starting leg duration (ms) — how long one wander leg takes right after the pot appears. Lower is faster. */
  potDriftLegMs: number;
  /** Wander range (px) once the pot has been sitting there the longest ("fully escalated"). */
  potDriftMaxRangePx: number;
  /** Leg duration (ms) once fully escalated. Lower is faster. */
  potDriftMinLegMs: number;
  /**
   * How many milliseconds of hesitation it takes to go from the starting drift speed/range to the
   * fully escalated one. 0 means the pot never speeds up — it drifts at a constant pace forever.
   */
  potDriftEscalationMs: number;
};

export const GAME_MODES: GameMode[] = ['easy', 'hard', 'crazy', 'impossible'];

export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  easy: {
    label: 'Easy',
    description: 'Longer word reveal, no decoy letters, hints allowed.',
    bannerDurationMs: 3500,
    decoyLetterCount: 0,
    hintAllowed: true,
    potDriftEnabled: false,
    potDriftRangePx: 0,
    potDriftLegMs: 0,
    potDriftMaxRangePx: 0,
    potDriftMinLegMs: 0,
    potDriftEscalationMs: 0,
  },
  hard: {
    label: 'Hard',
    description: 'Quicker reveal, a few decoy letters, no hints.',
    bannerDurationMs: 2200,
    decoyLetterCount: 3,
    hintAllowed: false,
    potDriftEnabled: false,
    potDriftRangePx: 0,
    potDriftLegMs: 0,
    potDriftMaxRangePx: 0,
    potDriftMinLegMs: 0,
    potDriftEscalationMs: 0,
  },
  crazy: {
    label: 'Crazy!',
    description: 'Blink-and-you-miss-it reveal, lots of decoy letters, no hints, and the pot wanders.',
    bannerDurationMs: 1200,
    decoyLetterCount: 6,
    hintAllowed: false,
    potDriftEnabled: true,
    potDriftRangePx: 55,
    potDriftLegMs: 2400,
    potDriftMaxRangePx: 55,
    potDriftMinLegMs: 2400,
    potDriftEscalationMs: 0,
  },
  impossible: {
    label: 'Impossible!!',
    description: 'A flash of a reveal, tons of decoy letters, and the pot speeds up the longer you take to aim.',
    bannerDurationMs: 900,
    decoyLetterCount: 8,
    hintAllowed: false,
    potDriftEnabled: true,
    potDriftRangePx: 40,
    potDriftLegMs: 2000,
    potDriftMaxRangePx: 100,
    potDriftMinLegMs: 450,
    potDriftEscalationMs: 6000,
  },
};

export function isGameMode(value: string): value is GameMode {
  return (GAME_MODES as string[]).includes(value);
}
