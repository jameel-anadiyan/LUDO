import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { PawnToken } from './src/components/PawnToken';
import { PlayerSeatCard } from './src/components/PlayerSeatCard';
import { RulesModal } from './src/components/RulesModal';
import { SetupScreen } from './src/components/SetupScreen';
import { VictoryModal } from './src/components/VictoryModal';
import { WoodenBoard } from './src/components/WoodenBoard';
import { WoodenDice } from './src/components/WoodenDice';
import { computeAllTokenPositions } from './src/engine/boardGeometry';
import { useLudoGame } from './src/hooks/useLudoGame';
import { WOODEN_THEME } from './src/theme/woodenTheme';
import { GameSettings, PlayerColor } from './src/types/ludo';

const DEFAULT_SETTINGS: GameSettings = {
  humanColor: 'red',
  botCount: 3,
  difficulty: 'medium',
  safePairs: false,
  autoMoveSingle: false,
  soundEnabled: true,
  hapticsEnabled: true,
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<'setup' | 'match'>('setup');
  const [draftSettings, setDraftSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);

  const game = useLudoGame(DEFAULT_SETTINGS);

  // Responsive square board calculation that fits phones, tablets, and desktop browsers
  const boardSize = useMemo(() => {
    const topSafe = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 12;
    const chromeVertical = topSafe + 258; // Top bar + Top seats + Bottom seats + Dice bar + Banner
    const availW = width - 20;
    const availH = height - chromeVertical;
    return Math.max(260, Math.min(availW, availH, 520));
  }, [width, height]);

  const framePad = Math.max(8, Math.round(boardSize * 0.028));
  const cellSize = (boardSize - framePad * 2) / 15;

  const positionedTokens = useMemo(
    () => computeAllTokenPositions(game.tokens),
    [game.tokens]
  );

  const playerByColor = (color: PlayerColor) =>
    game.players.find((p) => p.color === color);

  const rankOf = (color: PlayerColor): number | null => {
    const idx = game.finishedOrder.indexOf(color);
    return idx >= 0 ? idx + 1 : null;
  };

  const validMoveByTokenId = useMemo(() => {
    const map = new Map<string, (typeof game.validMoves)[number]>();
    if (game.currentPlayer && !game.currentPlayer.isBot && game.phase === 'selecting_token') {
      for (const m of game.validMoves) {
        map.set(m.tokenId, m);
      }
    }
    return map;
  }, [game.currentPlayer, game.phase, game.validMoves]);

  const handleStartFromSetup = () => {
    game.startNewMatch(draftSettings);
    setScreen('match');
  };

  return (
    <LinearGradient
      colors={[
        WOODEN_THEME.tabletopDark,
        WOODEN_THEME.tabletopMid,
        WOODEN_THEME.tabletopDark,
      ]}
      style={styles.root}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {screen === 'setup' ? (
          <SetupScreen
            settings={draftSettings}
            onUpdateSettings={setDraftSettings}
            onStartGame={handleStartFromSetup}
            onOpenRules={() => setRulesOpen(true)}
          />
        ) : (
          <View style={styles.matchContainer}>
            {/* Top Navigation & Controls Bar */}
            <View style={[styles.topBar, { width: Math.max(boardSize, 320) }]}>
              <Pressable
                onPress={() => setScreen('setup')}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Back to setup"
              >
                <Text style={styles.iconBtnText}>← Menu</Text>
              </Pressable>

              <Text style={styles.headerBrand}>ROYAL LUDO</Text>

              <View style={styles.rightActions}>
                <Pressable
                  onPress={() => game.toggleSetting('soundEnabled')}
                  style={styles.smallCircleBtn}
                  accessibilityLabel="Toggle sound"
                >
                  <Text style={styles.smallBtnIcon}>
                    {game.settings.soundEnabled ? '🔊' : '🔇'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRulesOpen(true)}
                  style={styles.smallCircleBtn}
                  accessibilityLabel="Open rules"
                >
                  <Text style={styles.smallBtnIcon}>?</Text>
                </Pressable>
                <Pressable
                  onPress={() => game.startNewMatch()}
                  style={styles.smallCircleBtn}
                  accessibilityLabel="Restart match"
                >
                  <Text style={styles.smallBtnIcon}>↻</Text>
                </Pressable>
              </View>
            </View>

            {/* Top Corner Player Seats: Red (Top-Left) & Green (Top-Right) */}
            <View style={[styles.seatRow, { width: boardSize }]}>
              <PlayerSeatCard
                player={playerByColor('red')}
                isCurrentTurn={game.currentPlayer?.color === 'red'}
                tokens={game.tokens}
                finishRank={rankOf('red')}
              />
              <PlayerSeatCard
                player={playerByColor('green')}
                isCurrentTurn={game.currentPlayer?.color === 'green'}
                tokens={game.tokens}
                finishRank={rankOf('green')}
                alignRight
              />
            </View>

            {/* Handcrafted 15x15 Wooden Board */}
            <WoodenBoard
              boardSize={boardSize}
              activeColors={game.players.map((p) => p.color)}
              currentTurnColor={game.currentPlayer?.color ?? 'red'}
              validMoves={game.validMoves}
              isHumanSelecting={
                !game.currentPlayer?.isBot && game.phase === 'selecting_token'
              }
              onSelectMove={(m) => game.performMove(m)}
            >
              {game.tokens.map((token) => {
                const pos = positionedTokens[token.id];
                const moveOpt = validMoveByTokenId.get(token.id);
                return (
                  <PawnToken
                    key={token.id}
                    token={token}
                    cx={pos?.cx ?? 0}
                    cy={pos?.cy ?? 0}
                    baseScale={pos?.scale ?? 1}
                    cellSize={cellSize}
                    isSelectable={Boolean(moveOpt)}
                    activeHop={game.activeHop}
                    onPress={() => {
                      if (moveOpt) game.performMove(moveOpt);
                    }}
                  />
                );
              })}
            </WoodenBoard>

            {/* Bottom Corner Player Seats: Blue (Bottom-Left) & Yellow (Bottom-Right) */}
            <View style={[styles.seatRow, { width: boardSize }]}>
              <PlayerSeatCard
                player={playerByColor('blue')}
                isCurrentTurn={game.currentPlayer?.color === 'blue'}
                tokens={game.tokens}
                finishRank={rankOf('blue')}
              />
              <PlayerSeatCard
                player={playerByColor('yellow')}
                isCurrentTurn={game.currentPlayer?.color === 'yellow'}
                tokens={game.tokens}
                finishRank={rankOf('yellow')}
                alignRight
              />
            </View>

            {/* Contextual Status Parchment Strip + Carved Ivory Dice */}
            <View style={[styles.bottomControls, { width: Math.max(boardSize, 320) }]}>
              <Text style={styles.bannerText} numberOfLines={1}>
                {game.bannerMessage}
              </Text>

              <WoodenDice
                value={game.diceValue}
                isRolling={game.phase === 'rolling'}
                canRoll={game.phase === 'waiting_for_roll'}
                turnColor={game.currentPlayer?.color ?? 'red'}
                isBotTurn={Boolean(game.currentPlayer?.isBot)}
                onRoll={game.rollDice}
              />
            </View>
          </View>
        )}

        <RulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} />

        <VictoryModal
          visible={screen === 'match' && game.phase === 'game_over'}
          standings={game.standings}
          tokens={game.tokens}
          stats={game.stats}
          humanColor={game.settings.humanColor}
          onPlayAgain={() => game.startNewMatch()}
          onChangeSetup={() => setScreen('setup')}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 16 : 0,
  },
  matchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  iconBtn: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: WOODEN_THEME.frameOuter,
    borderWidth: 1,
    borderColor: WOODEN_THEME.brassDark,
  },
  iconBtnText: {
    color: WOODEN_THEME.brassLight,
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerBrand: {
    color: WOODEN_THEME.brassGold,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WOODEN_THEME.frameOuter,
    borderWidth: 1,
    borderColor: WOODEN_THEME.brassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBtnIcon: {
    color: WOODEN_THEME.brassLight,
    fontSize: 14,
    fontWeight: '800',
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
  },
  bannerText: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
