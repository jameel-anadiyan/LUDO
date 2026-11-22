import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActiveHopSequence } from '../components/PawnToken';
import { chooseAIMove } from '../engine/ai';
import {
  buildMatchPlayers,
  computeStandings,
  createInitialTokens,
  executeMove,
  getValidMoves,
  hasSingleUniqueChoice,
} from '../engine/rules';
import { HOUSE_COLORS } from '../theme/woodenTheme';
import {
  GameSettings,
  MatchLogItem,
  MoveOption,
  PlayerColor,
  PlayerConfig,
  PlayerStats,
  TokenState,
  TurnPhase,
} from '../types/ludo';
import { Feedback } from '../utils/feedback';

const INITIAL_STATS = (): Record<PlayerColor, PlayerStats> => ({
  red: { rolls: 0, sixes: 0, captures: 0, capturedCount: 0 },
  green: { rolls: 0, sixes: 0, captures: 0, capturedCount: 0 },
  yellow: { rolls: 0, sixes: 0, captures: 0, capturedCount: 0 },
  blue: { rolls: 0, sixes: 0, captures: 0, capturedCount: 0 },
});

export function useLudoGame(initialSettings: GameSettings) {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [players, setPlayers] = useState<PlayerConfig[]>(() =>
    buildMatchPlayers(initialSettings)
  );
  const [tokens, setTokens] = useState<TokenState[]>(() =>
    createInitialTokens(buildMatchPlayers(initialSettings).map((p) => p.color))
  );
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [phase, setPhase] = useState<TurnPhase>('waiting_for_roll');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [activeHop, setActiveHop] = useState<ActiveHopSequence | null>(null);
  const [finishedOrder, setFinishedOrder] = useState<PlayerColor[]>([]);
  const [stats, setStats] = useState<Record<PlayerColor, PlayerStats>>(INITIAL_STATS);
  const [logs, setLogs] = useState<MatchLogItem[]>([]);
  const [bannerMessage, setBannerMessage] = useState<string>(
    'Tap the ivory die to roll — roll a 6 to deploy a pawn!'
  );

  // Epoch & timers guard against stale callbacks on restart or unmount
  const epochRef = useRef<number>(1);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Latest state snapshot ref for async callbacks
  const latestRef = useRef({
    settings,
    players,
    tokens,
    turnIndex,
    phase,
    consecutiveSixes,
    finishedOrder,
  });
  latestRef.current = {
    settings,
    players,
    tokens,
    turnIndex,
    phase,
    consecutiveSixes,
    finishedOrder,
  };

  const clearAllTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const myEpoch = epochRef.current;
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      if (epochRef.current !== myEpoch) return;
      fn();
    }, ms);
    timersRef.current.add(timer);
  }, []);

  useEffect(() => {
    return () => {
      epochRef.current += 1;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const appendLog = useCallback((color: PlayerColor, message: string) => {
    setLogs((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, color, message },
      ...prev.slice(0, 14),
    ]);
  }, []);

  const advanceTurn = useCallback(
    (currentTurnIdx: number, activePlayers: PlayerConfig[], finished: PlayerColor[]) => {
      const finishedSet = new Set(finished);
      let nextIdx = currentTurnIdx;
      for (let step = 1; step <= activePlayers.length; step++) {
        const candidate = (currentTurnIdx + step) % activePlayers.length;
        if (!finishedSet.has(activePlayers[candidate].color)) {
          nextIdx = candidate;
          break;
        }
      }

      const nextPlayer = activePlayers[nextIdx];
      setConsecutiveSixes(0);
      setDiceValue(null);
      setValidMoves([]);
      setTurnIndex(nextIdx);
      setPhase('waiting_for_roll');
      setBannerMessage(
        nextPlayer.isBot
          ? `${nextPlayer.name} (${HOUSE_COLORS[nextPlayer.color].shortName}) is preparing to roll...`
          : 'Your turn! Tap the ivory die to roll.'
      );
    },
    []
  );

  const performMove = useCallback(
    (move: MoveOption) => {
      const snap = latestRef.current;
      if (snap.phase !== 'selecting_token') return;

      const actor = snap.players[snap.turnIndex];
      const { nextTokens, hopWaypoints, earnedBonusRoll, playerFinishedNow } = executeMove(
        snap.tokens,
        move
      );

      setValidMoves([]);
      setPhase('animating_move');
      const myEpoch = epochRef.current;

      setActiveHop({
        tokenId: move.tokenId,
        waypoints: hopWaypoints,
        onHopStep: () => {
          if (epochRef.current !== myEpoch) return;
          Feedback.pawnHop(
            latestRef.current.settings.soundEnabled,
            latestRef.current.settings.hapticsEnabled
          );
        },
        onFinished: () => {
          if (epochRef.current !== myEpoch) return;

          setActiveHop(null);
          setTokens(nextTokens);

          const curSettings = latestRef.current.settings;

          // Record captures & play feedback
          if (move.capturedTokenIds.length > 0) {
            Feedback.capture(curSettings.soundEnabled, curSettings.hapticsEnabled);
            const capturedColors = move.capturedTokenIds.map(
              (id) => snap.tokens.find((t) => t.id === id)?.color
            );
            setStats((prev) => {
              const copy = { ...prev };
              copy[move.color] = {
                ...copy[move.color],
                captures: copy[move.color].captures + move.capturedTokenIds.length,
              };
              for (const c of capturedColors) {
                if (c) {
                  copy[c] = { ...copy[c], capturedCount: copy[c].capturedCount + 1 };
                }
              }
              return copy;
            });
            appendLog(
              move.color,
              `${actor.name} captured an opponent pawn and earned a bonus roll!`
            );
          } else if (move.isEnterGoal) {
            Feedback.reachGoal(curSettings.soundEnabled, curSettings.hapticsEnabled);
            appendLog(move.color, `${actor.name} brought a pawn home!`);
          } else if (move.isExitYard) {
            appendLog(move.color, `${actor.name} deployed a pawn onto the board.`);
          }

          // Check player completion & game over
          if (playerFinishedNow) {
            const updatedFinished = [...snap.finishedOrder, move.color];
            setFinishedOrder(updatedFinished);

            const isHumanDone = !actor.isBot;
            const allResolved = updatedFinished.length >= snap.players.length - 1;

            if (isHumanDone || allResolved) {
              Feedback.victory(curSettings.soundEnabled, curSettings.hapticsEnabled);
              setPhase('game_over');
              const humanRank = updatedFinished.indexOf(snap.settings.humanColor) + 1;
              setBannerMessage(
                humanRank === 1
                  ? 'Victory! All four of your pawns reached Home first!'
                  : `Match complete! ${actor.name} finished.`
              );
              return;
            }

            setBannerMessage(
              `${actor.name} finished in #${updatedFinished.length} place!`
            );
            schedule(() => {
              advanceTurn(snap.turnIndex, snap.players, updatedFinished);
            }, 650);
            return;
          }

          // Bonus turn on rolling 6, capturing, or reaching Home Goal
          if (earnedBonusRoll) {
            const reason =
              move.capturedTokenIds.length > 0
                ? 'Capture bonus roll!'
                : move.isEnterGoal
                ? 'Home goal bonus roll!'
                : 'Rolled a 6 — bonus roll!';
            setBannerMessage(
              actor.isBot ? `${actor.name}: ${reason}` : `${reason} Roll again!`
            );
            schedule(() => {
              setDiceValue(null);
              setPhase('waiting_for_roll');
            }, move.capturedTokenIds.length > 0 ? 360 : 240);
            return;
          }

          schedule(() => {
            advanceTurn(snap.turnIndex, snap.players, snap.finishedOrder);
          }, 220);
        },
      });
    },
    [advanceTurn, appendLog, schedule]
  );

  const rollDice = useCallback(() => {
    const snap = latestRef.current;
    if (snap.phase !== 'waiting_for_roll') return;

    const actor = snap.players[snap.turnIndex];
    Feedback.diceRoll(snap.settings.soundEnabled, snap.settings.hapticsEnabled);
    setPhase('rolling');

    const rolled = Math.floor(Math.random() * 6) + 1;

    setStats((prev) => ({
      ...prev,
      [actor.color]: {
        ...prev[actor.color],
        rolls: prev[actor.color].rolls + 1,
        sixes: prev[actor.color].sixes + (rolled === 6 ? 1 : 0),
      },
    }));

    schedule(() => {
      const afterRollSnap = latestRef.current;
      setDiceValue(rolled);

      const nextSixes = rolled === 6 ? afterRollSnap.consecutiveSixes + 1 : 0;

      // Classic Triple-6 Forfeit Rule
      if (nextSixes >= 3) {
        setConsecutiveSixes(0);
        setBannerMessage(`${actor.name} rolled three consecutive 6s! Turn passes.`);
        appendLog(actor.color, `${actor.name} rolled triple 6s — turn forfeited.`);
        schedule(() => {
          advanceTurn(
            afterRollSnap.turnIndex,
            afterRollSnap.players,
            afterRollSnap.finishedOrder
          );
        }, 900);
        return;
      }

      setConsecutiveSixes(nextSixes);

      const moves = getValidMoves(
        afterRollSnap.tokens,
        actor.color,
        rolled,
        afterRollSnap.settings.safePairs
      );

      if (moves.length === 0) {
        setBannerMessage(`${actor.name} rolled ${rolled} — no legal moves.`);
        schedule(() => {
          advanceTurn(
            afterRollSnap.turnIndex,
            afterRollSnap.players,
            afterRollSnap.finishedOrder
          );
        }, 780);
        return;
      }

      setValidMoves(moves);
      setPhase('selecting_token');

      if (actor.isBot) {
        setBannerMessage(`${actor.name} rolled ${rolled} — choosing a move...`);
        schedule(() => {
          const chosen = chooseAIMove(
            latestRef.current.tokens,
            moves,
            actor.difficulty
          );
          performMove(chosen);
        }, 380);
        return;
      }

      // Human turn with valid moves
      if (afterRollSnap.settings.autoMoveSingle && hasSingleUniqueChoice(moves)) {
        setBannerMessage(`Rolled ${rolled} — moving automatically...`);
        schedule(() => {
          performMove(moves[0]);
        }, 260);
        return;
      }

      const canCapture = moves.some((m) => m.capturedTokenIds.length > 0);
      setBannerMessage(
        canCapture
          ? `Rolled ${rolled}! Tap a glowing pawn to capture!`
          : rolled === 6
          ? 'Rolled 6! Tap a yard pawn to deploy or advance an active pawn.'
          : `Rolled ${rolled} — tap a glowing pawn to move.`
      );
    }, 430);
  }, [advanceTurn, appendLog, performMove, schedule]);

  // Automatically trigger AI Bot roll when waiting_for_roll on a Bot's seat
  useEffect(() => {
    if (phase !== 'waiting_for_roll') return;
    const currentPlayer = players[turnIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    const myEpoch = epochRef.current;
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      if (epochRef.current !== myEpoch) return;
      rollDice();
    }, 520);
    timersRef.current.add(timer);

    return () => {
      clearTimeout(timer);
      timersRef.current.delete(timer);
    };
  }, [phase, turnIndex, players, rollDice]);

  const startNewMatch = useCallback(
    (nextSettings?: GameSettings) => {
      epochRef.current += 1;
      clearAllTimers();

      const appliedSettings = nextSettings ?? latestRef.current.settings;
      if (nextSettings) setSettings(nextSettings);

      const nextPlayers = buildMatchPlayers(appliedSettings);
      const nextTokens = createInitialTokens(nextPlayers.map((p) => p.color));

      setPlayers(nextPlayers);
      setTokens(nextTokens);
      setTurnIndex(0);
      setPhase('waiting_for_roll');
      setDiceValue(null);
      setConsecutiveSixes(0);
      setValidMoves([]);
      setActiveHop(null);
      setFinishedOrder([]);
      setStats(INITIAL_STATS());
      setLogs([]);
      setBannerMessage('Match started! Tap the ivory die to roll.');
    },
    [clearAllTimers]
  );

  const toggleSetting = useCallback(
    (key: 'soundEnabled' | 'hapticsEnabled' | 'autoMoveSingle' | 'safePairs') => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const currentPlayer = players[turnIndex];

  const standings = useMemo(
    () => computeStandings(players, tokens, finishedOrder),
    [players, tokens, finishedOrder]
  );

  return {
    settings,
    players,
    tokens,
    currentPlayer,
    phase,
    diceValue,
    consecutiveSixes,
    validMoves,
    activeHop,
    finishedOrder,
    standings,
    stats,
    logs,
    bannerMessage,
    rollDice,
    performMove,
    startNewMatch,
    toggleSetting,
  };
}
