import { CLOCKWISE_COLORS, BOT_NAMES } from '../theme/woodenTheme';
import {
  GameSettings,
  GridPoint,
  MoveOption,
  PlayerColor,
  PlayerConfig,
  TokenState,
} from '../types/ludo';
import {
  SAFE_TRACK_INDICES,
  getOuterTrackIndex,
  getStepGridPoint,
} from './boardGeometry';

/**
 * Build ordered active seats around the board starting from humanColor or standard clockwise.
 * For 2 players (1 bot), places the AI bot in the opposite corner for balanced classic play!
 */
export function buildMatchPlayers(settings: GameSettings): PlayerConfig[] {
  const { humanColor, botCount, difficulty } = settings;
  const humanIdx = CLOCKWISE_COLORS.indexOf(humanColor);

  let activeColors: PlayerColor[];
  if (botCount === 1) {
    const oppositeColor = CLOCKWISE_COLORS[(humanIdx + 2) % 4];
    activeColors = [humanColor, oppositeColor];
  } else if (botCount === 2) {
    activeColors = [
      humanColor,
      CLOCKWISE_COLORS[(humanIdx + 1) % 4],
      CLOCKWISE_COLORS[(humanIdx + 2) % 4],
    ];
  } else {
    activeColors = [
      humanColor,
      CLOCKWISE_COLORS[(humanIdx + 1) % 4],
      CLOCKWISE_COLORS[(humanIdx + 2) % 4],
      CLOCKWISE_COLORS[(humanIdx + 3) % 4],
    ];
  }

  return activeColors.map((color) => ({
    color,
    name: color === humanColor ? 'You' : BOT_NAMES[color],
    isBot: color !== humanColor,
    difficulty,
  }));
}

export function createInitialTokens(activeColors: readonly PlayerColor[]): TokenState[] {
  const tokens: TokenState[] = [];
  for (const color of activeColors) {
    for (let i = 0; i < 4; i++) {
      const tokenIndex = i as 0 | 1 | 2 | 3;
      tokens.push({
        id: `${color}-${tokenIndex}`,
        color,
        tokenIndex,
        step: -1,
      });
    }
  }
  return tokens;
}

export function isStepSafe(color: PlayerColor, step: number): boolean {
  if (step < 0 || step >= 51) return true;
  const trackIdx = getOuterTrackIndex(color, step);
  return trackIdx !== null && SAFE_TRACK_INDICES.has(trackIdx);
}

/**
 * Determine all legal moves for `color` given `diceValue` (1..6).
 */
export function getValidMoves(
  tokens: readonly TokenState[],
  color: PlayerColor,
  diceValue: number,
  safePairs: boolean
): MoveOption[] {
  const moves: MoveOption[] = [];
  const myTokens = tokens.filter((t) => t.color === color);

  for (const token of myTokens) {
    if (token.step >= 56) continue;

    // Exiting yard requires rolling a 6
    if (token.step === -1) {
      if (diceValue === 6) {
        moves.push({
          tokenId: token.id,
          tokenIndex: token.tokenIndex,
          color,
          fromStep: -1,
          toStep: 0,
          diceValue,
          isExitYard: true,
          isEnterGoal: false,
          isSafeDestination: true, // Start square is always safe
          capturedTokenIds: [],
        });
      }
      continue;
    }

    const nextStep = token.step + diceValue;
    if (nextStep > 56) continue; // Exact roll required to enter home goal

    const isEnterGoal = nextStep === 56;
    const destSafe = isStepSafe(color, nextStep);
    const capturedTokenIds: string[] = [];

    if (!destSafe && nextStep <= 50) {
      const destTrackIdx = getOuterTrackIndex(color, nextStep);
      if (destTrackIdx !== null) {
        // Group opponent tokens currently at destTrackIdx by their color
        const opponentsAtDest = tokens.filter((other) => {
          if (other.color === color) return false;
          const otherTrackIdx = getOuterTrackIndex(other.color, other.step);
          return otherTrackIdx === destTrackIdx;
        });

        if (opponentsAtDest.length > 0) {
          if (safePairs) {
            // Count per opponent color: pairs (2+) of same color are immune
            const byColor = new Map<PlayerColor, TokenState[]>();
            for (const opp of opponentsAtDest) {
              const arr = byColor.get(opp.color) ?? [];
              arr.push(opp);
              byColor.set(opp.color, arr);
            }
            for (const group of byColor.values()) {
              if (group.length === 1) {
                capturedTokenIds.push(group[0].id);
              }
            }
          } else {
            for (const opp of opponentsAtDest) {
              capturedTokenIds.push(opp.id);
            }
          }
        }
      }
    }

    moves.push({
      tokenId: token.id,
      tokenIndex: token.tokenIndex,
      color,
      fromStep: token.step,
      toStep: nextStep,
      diceValue,
      isExitYard: false,
      isEnterGoal,
      isSafeDestination: destSafe,
      capturedTokenIds,
    });
  }

  return moves;
}

/**
 * Check if all valid moves are functionally identical (e.g., all movable tokens are in yard).
 */
export function hasSingleUniqueChoice(moves: readonly MoveOption[]): boolean {
  if (moves.length === 0) return false;
  if (moves.length === 1) return true;
  if (moves.every((m) => m.isExitYard)) return true;
  // Also if all movable tokens sit on the exact same step of the same color
  const firstFrom = moves[0].fromStep;
  return moves.every((m) => m.fromStep === firstFrom);
}

export interface MoveExecutionResult {
  nextTokens: TokenState[];
  hopWaypoints: GridPoint[];
  earnedBonusRoll: boolean;
  playerFinishedNow: boolean;
}

/**
 * Apply a chosen move and generate step-by-step GridPoint waypoints for hopping animation.
 */
export function executeMove(
  tokens: readonly TokenState[],
  move: MoveOption
): MoveExecutionResult {
  const movingToken = tokens.find((t) => t.id === move.tokenId)!;
  const hopWaypoints: GridPoint[] = [];

  if (move.isExitYard) {
    hopWaypoints.push(getStepGridPoint(move.color, 0, move.tokenIndex));
  } else {
    for (let s = move.fromStep + 1; s <= move.toStep; s++) {
      hopWaypoints.push(getStepGridPoint(move.color, s, move.tokenIndex));
    }
  }

  const capturedSet = new Set(move.capturedTokenIds);
  const nextTokens = tokens.map((t) => {
    if (t.id === move.tokenId) {
      return { ...t, step: move.toStep };
    }
    if (capturedSet.has(t.id)) {
      return { ...t, step: -1 };
    }
    return t;
  });

  const finishedCount = nextTokens.filter(
    (t) => t.color === move.color && t.step === 56
  ).length;
  const playerFinishedNow = finishedCount === 4 && movingToken.step < 56;

  // Classic Ludo bonus roll: rolled a 6, captured an opponent, or brought a pawn into Home Goal (unless player just finished all 4 pawns)
  const earnedBonusRoll =
    !playerFinishedNow &&
    (move.diceValue === 6 || move.capturedTokenIds.length > 0 || move.isEnterGoal);

  return {
    nextTokens,
    hopWaypoints,
    earnedBonusRoll,
    playerFinishedNow,
  };
}

export function isPlayerFinished(
  tokens: readonly TokenState[],
  color: PlayerColor
): boolean {
  return tokens.filter((t) => t.color === color && t.step === 56).length === 4;
}

/**
 * Compute final podium ordering: finished players first (in order they finished),
 * followed by remaining players sorted by finished pawns & total step progress.
 */
export function computeStandings(
  players: readonly PlayerConfig[],
  tokens: readonly TokenState[],
  finishedOrder: readonly PlayerColor[]
): PlayerConfig[] {
  const finishedSet = new Set(finishedOrder);
  const podium: PlayerConfig[] = [];

  for (const color of finishedOrder) {
    const p = players.find((pl) => pl.color === color);
    if (p) podium.push(p);
  }

  const remaining = players.filter((p) => !finishedSet.has(p.color));
  remaining.sort((a, b) => {
    const aTokens = tokens.filter((t) => t.color === a.color);
    const bTokens = tokens.filter((t) => t.color === b.color);
    const aGoals = aTokens.filter((t) => t.step === 56).length;
    const bGoals = bTokens.filter((t) => t.step === 56).length;
    if (bGoals !== aGoals) return bGoals - aGoals;

    const aProgress = aTokens.reduce((sum, t) => sum + Math.max(0, t.step + 1), 0);
    const bProgress = bTokens.reduce((sum, t) => sum + Math.max(0, t.step + 1), 0);
    return bProgress - aProgress;
  });

  return [...podium, ...remaining];
}
