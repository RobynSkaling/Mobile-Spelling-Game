// Sizing for the Honey Pot Flick screen. The pot field is the one flexible region (it takes whatever
// height is left), so everything else has to be sized from the screen and letter count up front —
// otherwise a long word's tray grows until the layout is taller than the phone (Epic 28).

export const FLICK_TILE_MAX = 58;
export const FLICK_TILE_MIN = 36;
export const FLICK_TILE_GAP = 6;
export const ANSWER_TILE_MAX = 42;
export const ANSWER_TILE_MIN = 22;
export const ANSWER_TILE_GAP = 3;
// The tray may take at most this share of the screen height; the rest of the budget is the field.
const TRAY_HEIGHT_SHARE = 0.26;
// Screens at or below this height get the compact header (small characters, no spare lines).
export const COMPACT_HEIGHT_PX = 760;

export type TraySizing = {
  tileSize: number;
  columns: number;
  rows: number;
  height: number;
};

/** Largest tile size (within min/max) whose wrapped rows fit `maxHeight`. Falls back to the minimum
 *  tile, which may exceed `maxHeight`, rather than ever shrinking below a readable size. */
export function getTraySizing(trayWidth: number, letterCount: number, maxHeight: number): TraySizing {
  const count = Math.max(letterCount, 1);
  const width = Math.max(trayWidth, FLICK_TILE_MIN);

  const measure = (tileSize: number): TraySizing => {
    const columns = Math.max(1, Math.floor((width + FLICK_TILE_GAP) / (tileSize + FLICK_TILE_GAP)));
    const rows = Math.ceil(count / columns);
    return { tileSize, columns, rows, height: rows * (tileSize + FLICK_TILE_GAP) - FLICK_TILE_GAP };
  };

  for (let tileSize = FLICK_TILE_MAX; tileSize > FLICK_TILE_MIN; tileSize -= 1) {
    const sizing = measure(tileSize);
    if (sizing.height <= maxHeight) {
      return sizing;
    }
  }

  return measure(FLICK_TILE_MIN);
}

/** Size of the answer-row tiles so the whole word stays on one line. */
export function getAnswerTileSize(rowWidth: number, wordLength: number): number {
  const count = Math.max(wordLength, 1);
  const fit = Math.floor((rowWidth - count * ANSWER_TILE_GAP) / count);
  return Math.max(ANSWER_TILE_MIN, Math.min(ANSWER_TILE_MAX, fit));
}

export type FlickLayout = {
  compact: boolean;
  characterSize: number;
  tray: TraySizing;
  answerTileSize: number;
};

export function getFlickLayout(params: {
  screenWidth: number;
  screenHeight: number;
  horizontalPadding: number;
  letterCount: number;
  wordLength: number;
}): FlickLayout {
  const { screenWidth, screenHeight, horizontalPadding, letterCount, wordLength } = params;
  const contentWidth = Math.max(screenWidth - horizontalPadding * 2, 0);
  const compact = screenHeight <= COMPACT_HEIGHT_PX;

  return {
    compact,
    characterSize: compact ? 52 : 80,
    tray: getTraySizing(contentWidth, letterCount, screenHeight * TRAY_HEIGHT_SHARE),
    answerTileSize: getAnswerTileSize(contentWidth, wordLength),
  };
}

export const BANNER_FONT_MAX = 48;
export const BANNER_FONT_MIN = 18;
// Banner card chrome: 12px border + 2 * 16px side padding, on a card capped at 92% of the screen.
const BANNER_CARD_WIDTH_SHARE = 0.92;
const BANNER_CHROME_PX = 44;
const BANNER_LETTER_SPACING_PX = 2;
const BANNER_GLYPH_WIDTH_EM = 0.75;

/** Font size for the word-reveal banner so a long word ("questionnaire") fits on one line. */
export function getBannerFontSize(screenWidth: number, wordLength: number): number {
  const count = Math.max(wordLength, 1);
  const available = screenWidth * BANNER_CARD_WIDTH_SHARE - BANNER_CHROME_PX - count * BANNER_LETTER_SPACING_PX;
  const fit = Math.floor(available / (count * BANNER_GLYPH_WIDTH_EM));
  return Math.max(BANNER_FONT_MIN, Math.min(BANNER_FONT_MAX, fit));
}
