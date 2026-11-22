import { GridPoint, PlayerColor, TokenState } from '../types/ludo';

/**
 * Standard 15x15 Ludo outer clockwise path (52 squares, indices 0..51).
 * Each entry is [row, col] with row 0..14 (top->bottom), col 0..14 (left->right).
 */
export const OUTER_TRACK_CELLS: ReadonlyArray<readonly [number, number]> = [
  // Left arm, top row (left -> right)
  [6, 0],
  [6, 1], // 1: RED START (Safe)
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  // Top arm, left col (bottom -> top)
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6], // 9: STAR SAFE
  [1, 6],
  [0, 6],
  // Top arm, top edge
  [0, 7], // 12: Green turns into home stretch after here
  [0, 8],
  // Top arm, right col (top -> bottom)
  [1, 8], // 14: GREEN START (Safe)
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  // Right arm, top row (left -> right)
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12], // 22: STAR SAFE
  [6, 13],
  [6, 14],
  // Right arm, right edge
  [7, 14], // 25: Yellow turns into home stretch after here
  [8, 14],
  // Right arm, bottom row (right -> left)
  [8, 13], // 27: YELLOW START (Safe)
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  // Bottom arm, right col (top -> bottom)
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8], // 35: STAR SAFE
  [13, 8],
  [14, 8],
  // Bottom arm, bottom edge
  [14, 7], // 38: Blue turns into home stretch after here
  [14, 6],
  // Bottom arm, left col (bottom -> top)
  [13, 6], // 40: BLUE START (Safe)
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  // Left arm, bottom row (right -> left)
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2], // 48: STAR SAFE
  [8, 1],
  [8, 0],
  // Left arm, left edge
  [7, 0], // 51: Red turns into home stretch after here
];

export const START_TRACK_INDEX: Record<PlayerColor, number> = {
  red: 1,
  green: 14,
  yellow: 27,
  blue: 40,
};

export const STAR_TRACK_INDICES: ReadonlyArray<number> = [9, 22, 35, 48];

export const SAFE_TRACK_INDICES: ReadonlySet<number> = new Set([
  1, 9, 14, 22, 27, 35, 40, 48,
]);

/**
 * Private 5-cell colored Home Stretch for steps 51..55 ([row, col])
 */
export const HOME_STRETCH_CELLS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ],
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
  ],
};

/**
 * Rotate a point in [0..15]x[0..15] clockwise around board center (7.5, 7.5)
 */
function rotateCW(pt: GridPoint, quarterTurns: 0 | 1 | 2 | 3): GridPoint {
  let { cx, cy } = pt;
  for (let i = 0; i < quarterTurns; i++) {
    const nextCx = 15 - cy;
    const nextCy = cx;
    cx = nextCx;
    cy = nextCy;
  }
  return { cx, cy };
}

const RED_YARD_SOCKETS: ReadonlyArray<GridPoint> = [
  { cx: 1.95, cy: 1.95 },
  { cx: 4.05, cy: 1.95 },
  { cx: 1.95, cy: 4.05 },
  { cx: 4.05, cy: 4.05 },
];

export const YARD_SOCKETS: Record<PlayerColor, ReadonlyArray<GridPoint>> = {
  red: RED_YARD_SOCKETS,
  green: [
    { cx: 10.95, cy: 1.95 },
    { cx: 13.05, cy: 1.95 },
    { cx: 10.95, cy: 4.05 },
    { cx: 13.05, cy: 4.05 },
  ],
  yellow: [
    { cx: 10.95, cy: 10.95 },
    { cx: 13.05, cy: 10.95 },
    { cx: 10.95, cy: 13.05 },
    { cx: 13.05, cy: 13.05 },
  ],
  blue: [
    { cx: 1.95, cy: 10.95 },
    { cx: 4.05, cy: 10.95 },
    { cx: 1.95, cy: 13.05 },
    { cx: 4.05, cy: 13.05 },
  ],
};

// Base finished pockets inside Red's left triangle (6,6)-(6,9)-(7.5,7.5)
const RED_GOAL_POCKETS: ReadonlyArray<GridPoint> = [
  { cx: 6.38, cy: 6.95 },
  { cx: 6.38, cy: 8.05 },
  { cx: 6.82, cy: 7.28 },
  { cx: 6.82, cy: 7.72 },
];

export const GOAL_POCKETS: Record<PlayerColor, ReadonlyArray<GridPoint>> = {
  red: RED_GOAL_POCKETS,
  green: RED_GOAL_POCKETS.map((p) => rotateCW(p, 1)),
  yellow: RED_GOAL_POCKETS.map((p) => rotateCW(p, 2)),
  blue: RED_GOAL_POCKETS.map((p) => rotateCW(p, 3)),
};

/**
 * Convert (color, step) for step 0..50 into global outer track index 0..51.
 * Returns null if in yard (-1), home stretch (51..55), or goal (56).
 */
export function getOuterTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  return (START_TRACK_INDEX[color] + step) % 52;
}

/**
 * Get the raw [0..15] grid center for any token step (-1..56).
 */
export function getStepGridPoint(
  color: PlayerColor,
  step: number,
  tokenIndex: 0 | 1 | 2 | 3
): GridPoint {
  if (step < 0) {
    return YARD_SOCKETS[color][tokenIndex];
  }
  if (step <= 50) {
    const idx = (START_TRACK_INDEX[color] + step) % 52;
    const [row, col] = OUTER_TRACK_CELLS[idx];
    return { cx: col + 0.5, cy: row + 0.5 };
  }
  if (step <= 55) {
    const [row, col] = HOME_STRETCH_CELLS[color][step - 51];
    return { cx: col + 0.5, cy: row + 0.5 };
  }
  return GOAL_POCKETS[color][tokenIndex];
}

export interface PositionedToken {
  cx: number;
  cy: number;
  scale: number;
}

/**
 * Compute visual grid coordinates + scale for all tokens, neatly fanning out
 * multiple tokens sharing the same track or home-stretch square.
 */
export function computeAllTokenPositions(
  tokens: ReadonlyArray<TokenState>
): Record<string, PositionedToken> {
  const result: Record<string, PositionedToken> = {};
  const cellGroups = new Map<string, TokenState[]>();

  for (const t of tokens) {
    if (t.step < 0 || t.step >= 56) {
      const pt = getStepGridPoint(t.color, t.step, t.tokenIndex);
      result[t.id] = { cx: pt.cx, cy: pt.cy, scale: t.step >= 56 ? 0.72 : 1 };
      continue;
    }

    const pt = getStepGridPoint(t.color, t.step, t.tokenIndex);
    const key = `${pt.cx.toFixed(1)},${pt.cy.toFixed(1)}`;
    const list = cellGroups.get(key) ?? [];
    list.push(t);
    cellGroups.set(key, list);
  }

  const OFFSETS_2: ReadonlyArray<readonly [number, number]> = [
    [-0.18, -0.14],
    [0.18, 0.14],
  ];
  const OFFSETS_3: ReadonlyArray<readonly [number, number]> = [
    [0, -0.2],
    [-0.2, 0.16],
    [0.2, 0.16],
  ];
  const OFFSETS_4_PLUS: ReadonlyArray<readonly [number, number]> = [
    [-0.19, -0.19],
    [0.19, -0.19],
    [-0.19, 0.19],
    [0.19, 0.19],
  ];

  for (const group of cellGroups.values()) {
    const base = getStepGridPoint(group[0].color, group[0].step, group[0].tokenIndex);
    if (group.length === 1) {
      result[group[0].id] = { cx: base.cx, cy: base.cy, scale: 1 };
    } else if (group.length === 2) {
      group.forEach((t, idx) => {
        const [dx, dy] = OFFSETS_2[idx];
        result[t.id] = { cx: base.cx + dx, cy: base.cy + dy, scale: 0.82 };
      });
    } else if (group.length === 3) {
      group.forEach((t, idx) => {
        const [dx, dy] = OFFSETS_3[idx];
        result[t.id] = { cx: base.cx + dx, cy: base.cy + dy, scale: 0.76 };
      });
    } else {
      group.forEach((t, idx) => {
        const [dx, dy] = OFFSETS_4_PLUS[idx % 4];
        result[t.id] = { cx: base.cx + dx, cy: base.cy + dy, scale: 0.72 };
      });
    }
  }

  return result;
}
