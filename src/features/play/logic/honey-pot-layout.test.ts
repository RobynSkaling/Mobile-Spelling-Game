import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_WORD_LISTS } from '@/data/word-lists/built-in-word-lists';
import { GAME_MODES, GAME_MODE_CONFIG } from './game-modes';
import {
  ANSWER_TILE_GAP,
  ANSWER_TILE_MAX,
  ANSWER_TILE_MIN,
  BANNER_FONT_MAX,
  BANNER_FONT_MIN,
  FLICK_TILE_GAP,
  FLICK_TILE_MAX,
  FLICK_TILE_MIN,
  getAnswerTileSize,
  getBannerFontSize,
  getFlickLayout,
  getTraySizing,
} from './honey-pot-layout';

const SCREENS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
];
const longestWord = BUILT_IN_WORD_LISTS.flatMap((list) => list.words).reduce((a, b) => (b.length > a.length ? b : a));

describe('getTraySizing', () => {
  it('uses the largest tile when everything fits comfortably', () => {
    const sizing = getTraySizing(700, 5, 300);
    assert.equal(sizing.tileSize, FLICK_TILE_MAX);
    assert.equal(sizing.rows, 1);
  });

  it('shrinks tiles until the wrapped rows fit the height budget', () => {
    const roomy = getTraySizing(288, 19, 260);
    const tight = getTraySizing(288, 19, 150);
    assert.ok(tight.tileSize < roomy.tileSize);
    assert.ok(tight.height <= 150);
  });

  it('never goes below the minimum tile, even when it cannot fit', () => {
    const sizing = getTraySizing(288, 40, 50);
    assert.equal(sizing.tileSize, FLICK_TILE_MIN);
  });

  it('reports a height consistent with its rows and tile size', () => {
    const sizing = getTraySizing(288, 13, 200);
    assert.equal(sizing.height, sizing.rows * (sizing.tileSize + FLICK_TILE_GAP) - FLICK_TILE_GAP);
    assert.ok(sizing.columns * sizing.rows >= 13);
  });

  it('never lets a row be wider than the tray', () => {
    for (const width of [240, 288, 343, 736]) {
      for (const count of [3, 11, 13, 21]) {
        const { tileSize, columns } = getTraySizing(width, count, 180);
        assert.ok(columns * tileSize + (columns - 1) * FLICK_TILE_GAP <= Math.max(width, FLICK_TILE_MIN));
      }
    }
  });
});

describe('getAnswerTileSize', () => {
  it('keeps the whole word on one row', () => {
    for (const { width } of SCREENS) {
      for (const length of [3, 8, 13]) {
        const size = getAnswerTileSize(width - 32, length);
        assert.ok(length * size + (length - 1) * ANSWER_TILE_GAP <= width - 32 || size === ANSWER_TILE_MIN);
      }
    }
  });

  it('stays within its min and max', () => {
    assert.equal(getAnswerTileSize(700, 3), ANSWER_TILE_MAX);
    assert.equal(getAnswerTileSize(100, 13), ANSWER_TILE_MIN);
  });
});

describe('getFlickLayout', () => {
  it('uses the compact header on phones and not on tablets', () => {
    const phone = getFlickLayout({ screenWidth: 375, screenHeight: 667, horizontalPadding: 16, letterCount: 10, wordLength: 5 });
    const tablet = getFlickLayout({ screenWidth: 768, screenHeight: 1024, horizontalPadding: 16, letterCount: 10, wordLength: 5 });
    assert.equal(phone.compact, true);
    assert.equal(tablet.compact, false);
    assert.ok(tablet.characterSize > phone.characterSize);
  });

  it('keeps tiles readable for the longest built-in word with decoys in every mode on phones', () => {
    for (const screen of SCREENS.slice(0, 2)) {
      for (const mode of GAME_MODES) {
        const letterCount = longestWord.length + GAME_MODE_CONFIG[mode].decoyLetterCount;
        const layout = getFlickLayout({
          screenWidth: screen.width,
          screenHeight: screen.height,
          horizontalPadding: 16,
          letterCount,
          wordLength: longestWord.length,
        });
        assert.ok(layout.tray.tileSize >= FLICK_TILE_MIN, `${mode} ${screen.width}x${screen.height}`);
        assert.ok(layout.tray.height <= screen.height * 0.26 + layout.tray.tileSize, `${mode} tray too tall`);
      }
    }
  });
});

describe('getBannerFontSize', () => {
  it('uses the full size for short words and shrinks for long ones', () => {
    assert.equal(getBannerFontSize(375, 3), BANNER_FONT_MAX);
    assert.ok(getBannerFontSize(320, longestWord.length) < BANNER_FONT_MAX);
  });

  it('never drops below the minimum', () => {
    assert.equal(getBannerFontSize(200, 30), BANNER_FONT_MIN);
  });
});
