export type GameMode = 'easy' | 'hard' | 'crazy';

export type GameModeConfig = {
  label: string;
  description: string;
  bannerDurationMs: number;
  decoyLetterCount: number;
  hintAllowed: boolean;
  /** Whether the honey pot slowly wanders around the field instead of only jumping between rounds. */
  potDriftEnabled: boolean;
  /** How far the pot can wander from its current spot, in pixels. */
  potDriftRangePx: number;
  /** How long one leg of the wander takes — bigger is slower/gentler. */
  potDriftLegMs: number;
};

export const GAME_MODES: GameMode[] = ['easy', 'hard', 'crazy'];

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
  },
};

export function isGameMode(value: string): value is GameMode {
  return (GAME_MODES as string[]).includes(value);
}
