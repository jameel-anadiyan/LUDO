export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type SeatControl = 'human' | 'bot' | 'none';

export interface PlayerConfig {
  color: PlayerColor;
  name: string;
  isBot: boolean;
  difficulty: AIDifficulty;
}

export interface TokenState {
  id: string; // e.g., 'red-0'
  color: PlayerColor;
  tokenIndex: 0 | 1 | 2 | 3;
  /**
   * -1 = in corner yard (home base)
   * 0..50 = outer 52-cell shared track (relative steps from player's start cell)
   * 51..55 = player's private 5-cell colored home column
   * 56 = finished inside center home triangle
   */
  step: number;
}

export interface GridPoint {
  /** Horizontal position in [0..15] grid units (col + 0.5 for cell centers) */
  cx: number;
  /** Vertical position in [0..15] grid units (row + 0.5 for cell centers) */
  cy: number;
}

export interface MoveOption {
  tokenId: string;
  tokenIndex: 0 | 1 | 2 | 3;
  color: PlayerColor;
  fromStep: number;
  toStep: number;
  diceValue: number;
  isExitYard: boolean;
  isEnterGoal: boolean;
  isSafeDestination: boolean;
  capturedTokenIds: string[];
}

export interface GameSettings {
  humanColor: PlayerColor;
  botCount: 1 | 2 | 3;
  difficulty: AIDifficulty;
  safePairs: boolean;
  autoMoveSingle: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type TurnPhase = 'waiting_for_roll' | 'rolling' | 'selecting_token' | 'animating_move' | 'game_over';

export interface PlayerStats {
  rolls: number;
  sixes: number;
  captures: number;
  capturedCount: number;
}

export interface MatchLogItem {
  id: string;
  color: PlayerColor;
  message: string;
}
