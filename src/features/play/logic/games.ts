/**
 * The top-level "which game" choice (roadmap Epic 19; UX Step 13), sitting above the existing
 * `GameMode` ("how hard") choice from `game-modes.ts`. A `GameId` selection does not change what
 * a `GameMode` means — `easy`/`hard`/`crazy`/`impossible` still means the same age-band thing for
 * whichever game is selected (UX Step 13).
 */

export type GameId = 'honey-pot-flick' | 'bee-line';

export type GameConfig = {
  label: string;
};

export const GAMES: GameId[] = ['honey-pot-flick', 'bee-line'];

export const GAME_CONFIG: Record<GameId, GameConfig> = {
  'honey-pot-flick': { label: '🍯 Honey Pot Flick' },
  'bee-line': { label: '🐝 Bee Line' },
};

export function isGameId(value: string): value is GameId {
  return (GAMES as string[]).includes(value);
}
