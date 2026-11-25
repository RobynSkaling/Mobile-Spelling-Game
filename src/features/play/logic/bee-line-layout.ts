/**
 * Bee Line's tile sizing and spacing rules (roadmap Epic 29), pure and RN-independent like the rest
 * of this folder. The field is measured at runtime; this module turns that size plus the letter
 * count into a tile size and the minimum gap between tiles, so a long word on a small phone gets
 * smaller tiles (down to a floor) *before* the gaps ever shrink.
 */

export const BEE_LINE_TILE_MIN_PX = 40;
export const BEE_LINE_TILE_PHONE_MAX_PX = 52;
export const BEE_LINE_TILE_TABLET_MAX_PX = 64;
// Fields at least this wide count as a tablet and may use bigger tiles.
const TABLET_FIELD_WIDTH_PX = 560;
// Easy mode taps tiles, so each tile's tap target is never smaller than this even when the tile
// itself is drawn smaller (platform minimum touch target).
export const BEE_LINE_MIN_TAP_TARGET_PX = 44;
// Tiles are kept fully inside the field, clear of its 4px border.
export const BEE_LINE_FIELD_EDGE_PAD_PX = 4;
// Empty space between any two tiles, edge to edge, as a multiple of the tile width: one full tile,
// enough for the bee and its trail to pass between them.
export const BEE_LINE_GAP_FACTOR = 1;

// A correct tile is collected when the head's centre is this close (a fraction of the tile width):
// clearly over the hex, not just brushing its edge.
export const PICKUP_RADIUS_FACTOR = 0.45;
// Wrong tiles only register when the head's centre is this close — smaller than the visible tile
// (half a tile width) so grazing past one is forgiving.
export const BUMP_RADIUS_FACTOR = 0.3;
// Centre-to-centre spacing of trailing body segments.
export const TRAIL_SPACING_FACTOR = 0.6;
// How far ahead of the finger the head is drawn while dragging, so the finger doesn't hide it.
export const HEAD_LEAD_FACTOR = 1;

export type FieldSize = { width: number; height: number };

export type BeeLineTileLayout = {
  tileSize: number;
  /** Required empty space between any two tiles, edge to edge. */
  minGapPx: number;
  /** Required centre-to-centre distance between any two tiles (`tileSize + minGapPx`). */
  minCenterSpacingPx: number;
  /** Tap target size for easy mode: never below the platform minimum. */
  tapTargetPx: number;
  /** Decoys that fit with the full gap; fewer than requested when the field is too small. */
  decoyCount: number;
  requestedDecoyCount: number;
  /** True only when even the correct letters alone cannot keep the full gap at the minimum tile
   *  size; the gap is then reduced as far as needed so the word is still playable. */
  gapCompromised: boolean;
};

/** Room for tile centres along one axis: the field minus half a tile of margin on each side. */
export function getCentreRange(fieldExtent: number, tileSize: number): number {
  return Math.max(fieldExtent - tileSize - BEE_LINE_FIELD_EDGE_PAD_PX * 2, 0);
}

/** How many tile centres fit in the field with at least `centreSpacingPx` between neighbours. */
export function getTileCapacity(field: FieldSize, tileSize: number, centreSpacingPx: number): number {
  const columns = Math.floor(getCentreRange(field.width, tileSize) / centreSpacingPx + 1e-9) + 1;
  const rows = Math.floor(getCentreRange(field.height, tileSize) / centreSpacingPx + 1e-9) + 1;
  return columns * rows;
}

function buildLayout(
  field: FieldSize,
  tileSize: number,
  gapPx: number,
  decoyCount: number,
  requestedDecoyCount: number,
  gapCompromised: boolean,
): BeeLineTileLayout {
  return {
    tileSize,
    minGapPx: gapPx,
    minCenterSpacingPx: tileSize + gapPx,
    tapTargetPx: Math.max(tileSize, BEE_LINE_MIN_TAP_TARGET_PX),
    decoyCount,
    requestedDecoyCount,
    gapCompromised,
  };
}

/**
 * Picks the largest tile size (phone cap 52px, tablet cap 64px, floor 40px) at which every letter —
 * the word's own plus the requested decoys — fits with a full tile-width gap between all tiles.
 * Tiles shrink before gaps do. If even the 40px floor can't hold everything, the full gap is kept
 * and decoys are dropped (callers should surface `decoyCount < requestedDecoyCount` for product
 * review); only if the word's own letters alone don't fit is the gap itself reduced.
 */
export function getBeeLineTileLayout(field: FieldSize, wordLength: number, decoyCount: number): BeeLineTileLayout {
  const requested = Math.max(decoyCount, 0);
  const total = wordLength + requested;
  const maxTile = field.width >= TABLET_FIELD_WIDTH_PX ? BEE_LINE_TILE_TABLET_MAX_PX : BEE_LINE_TILE_PHONE_MAX_PX;

  for (let tileSize = maxTile; tileSize >= BEE_LINE_TILE_MIN_PX; tileSize -= 1) {
    const gap = tileSize * BEE_LINE_GAP_FACTOR;
    if (getTileCapacity(field, tileSize, tileSize + gap) >= total) {
      return buildLayout(field, tileSize, gap, requested, requested, false);
    }
  }

  const tileSize = BEE_LINE_TILE_MIN_PX;
  const gap = tileSize * BEE_LINE_GAP_FACTOR;
  const capacity = getTileCapacity(field, tileSize, tileSize + gap);
  if (capacity >= wordLength) {
    return buildLayout(field, tileSize, gap, capacity - wordLength, requested, false);
  }

  for (let reducedGap = gap - 1; reducedGap > 0; reducedGap -= 1) {
    if (getTileCapacity(field, tileSize, tileSize + reducedGap) >= wordLength) {
      return buildLayout(field, tileSize, reducedGap, 0, requested, true);
    }
  }

  return buildLayout(field, tileSize, 0, 0, requested, true);
}
