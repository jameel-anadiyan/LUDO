import { AIDifficulty, MoveOption, PlayerColor, TokenState } from '../types/ludo';
import { SAFE_TRACK_INDICES, START_TRACK_INDEX, getOuterTrackIndex } from './boardGeometry';

/**
 * Count how many opponent tokens can reach `targetTrackIdx` within 1..6 steps
 * (or 7..11 steps via a 6 + roll for Hard AI).
 */
function evaluateTrackDanger(
  tokens: readonly TokenState[],
  myColor: PlayerColor,
  targetTrackIdx: number,
  includeExtendedThreat: boolean
): number {
  if (SAFE_TRACK_INDICES.has(targetTrackIdx)) return 0;

  let dangerScore = 0;

  for (const other of tokens) {
    if (other.color === myColor) continue;
    if (other.step === -1) {
      // Opponent in yard can exit onto START_TRACK_INDEX[other.color] with a 6 and roll again!
      if (includeExtendedThreat) {
        const oppStart = START_TRACK_INDEX[other.color];
        const distFromOppStart = (targetTrackIdx - oppStart + 52) % 52;
        if (distFromOppStart >= 1 && distFromOppStart <= 6) {
          dangerScore += 0.22;
        }
      }
      continue;
    }

    const oppTrack = getOuterTrackIndex(other.color, other.step);
    if (oppTrack === null) continue;

    // Clockwise distance from opponent to targetTrackIdx
    const dist = (targetTrackIdx - oppTrack + 52) % 52;
    // Also ensure opponent wouldn't turn into their own home stretch before reaching targetTrackIdx!
    if (dist >= 1 && dist <= 6 && other.step + dist <= 50) {
      dangerScore += 1.0;
    } else if (includeExtendedThreat && dist >= 7 && dist <= 12 && other.step + dist <= 50) {
      dangerScore += 0.18;
    }
  }

  return dangerScore;
}

/**
 * Check if landing at `targetTrackIdx` puts our token 1..6 steps behind a vulnerable opponent.
 */
function evaluateStalkingBonus(
  tokens: readonly TokenState[],
  myColor: PlayerColor,
  myToStep: number,
  targetTrackIdx: number
): number {
  let bonus = 0;
  for (const other of tokens) {
    if (other.color === myColor) continue;
    const oppTrack = getOuterTrackIndex(other.color, other.step);
    if (oppTrack === null || SAFE_TRACK_INDICES.has(oppTrack)) continue;

    const dist = (oppTrack - targetTrackIdx + 52) % 52;
    if (dist >= 1 && dist <= 6 && myToStep + dist <= 50) {
      bonus += 14 + other.step * 0.25;
    }
  }
  return bonus;
}

/**
 * Select the best move for an AI Bot according to difficulty tier.
 */
export function chooseAIMove(
  tokens: readonly TokenState[],
  moves: readonly MoveOption[],
  difficulty: AIDifficulty
): MoveOption {
  if (moves.length === 1) return moves[0];

  // Apprentice (Easy): captures & exits yard often, with playful noise
  if (difficulty === 'easy') {
    const scored = moves.map((m) => {
      let score = Math.random() * 45;
      if (m.capturedTokenIds.length > 0) score += 75;
      if (m.isExitYard) score += 55;
      if (m.isEnterGoal) score += 65;
      score += m.toStep * 0.3;
      return { move: m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  const isHard = difficulty === 'hard';

  const scoredMoves = moves.map((move) => {
    let score = 0;

    // 1. Capturing opponent pawns (huge reward, scaled by how far opponent had progressed)
    if (move.capturedTokenIds.length > 0) {
      for (const capId of move.capturedTokenIds) {
        const victim = tokens.find((t) => t.id === capId);
        const victimProgress = victim ? Math.max(0, victim.step) : 10;
        score += 135 + victimProgress * 1.6;
      }
    }

    // 2. Reaching Center Home Goal (permanent lock + bonus roll!)
    if (move.isEnterGoal) {
      score += 120;
    }

    // 3. Deploying pawn from Yard onto safe start square
    if (move.isExitYard) {
      const activeCount = tokens.filter(
        (t) => t.color === move.color && t.step >= 0 && t.step < 56
      ).length;
      // Strongly prefer having at least 2-3 active pawns on the board
      score += activeCount === 0 ? 130 : activeCount === 1 ? 98 : 78;
    }

    // 4. Entering private Home Stretch (steps 51..55 — permanent immunity!)
    if (move.fromStep <= 50 && move.toStep >= 51 && !move.isEnterGoal) {
      score += 88 + move.fromStep * 0.4;
    }

    // 5. Threat & Safety delta on outer track
    const fromTrack = getOuterTrackIndex(move.color, move.fromStep);
    const toTrack = getOuterTrackIndex(move.color, move.toStep);

    const currentDanger =
      fromTrack !== null
        ? evaluateTrackDanger(tokens, move.color, fromTrack, isHard)
        : 0;
    const nextDanger =
      toTrack !== null
        ? evaluateTrackDanger(tokens, move.color, toTrack, isHard)
        : 0;

    // Escaping immediate danger is critical, especially for advanced tokens
    const progressRiskMultiplier = 1 + Math.max(0, move.fromStep) / 22;
    if (currentDanger > 0) {
      score += currentDanger * 52 * progressRiskMultiplier;
    }
    if (nextDanger > 0) {
      score -= nextDanger * 58 * (1 + Math.max(0, move.toStep) / 20);
    }

    // Landing on a safe star/start square
    if (!move.isExitYard && move.toStep <= 50 && move.isSafeDestination) {
      score += 42;
    }

    // Leaving a safe square without a strong reason
    if (
      fromTrack !== null &&
      SAFE_TRACK_INDICES.has(fromTrack) &&
      nextDanger > 0 &&
      move.capturedTokenIds.length === 0
    ) {
      score -= 24;
    }

    // Hard AI: hunting / stalking bonus + anti-clustering on unsafe cells
    if (isHard && toTrack !== null) {
      if (nextDanger === 0) {
        score += evaluateStalkingBonus(tokens, move.color, move.toStep, toTrack);
      }
      if (!SAFE_TRACK_INDICES.has(toTrack)) {
        const ownAtDest = tokens.filter(
          (t) =>
            t.color === move.color &&
            t.id !== move.tokenId &&
            getOuterTrackIndex(t.color, t.step) === toTrack
        ).length;
        if (ownAtDest > 0 && nextDanger > 0) {
          score -= 30; // Don't stack two vulnerable pawns if safePairs is off
        }
      }
    }

    // General forward progression tie-breaker
    if (!move.isExitYard) {
      score += move.toStep * 0.55;
    }

    // Slight jitter for natural tie-breaking
    score += Math.random() * (isHard ? 2.5 : 8);

    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}
