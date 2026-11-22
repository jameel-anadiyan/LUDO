import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import { PlayerColor, PlayerConfig, PlayerStats, TokenState } from '../types/ludo';

interface VictoryModalProps {
  visible: boolean;
  standings: ReadonlyArray<PlayerConfig>;
  tokens: ReadonlyArray<TokenState>;
  stats: Record<PlayerColor, PlayerStats>;
  humanColor: PlayerColor;
  onPlayAgain: () => void;
  onChangeSetup: () => void;
}

const MEDALS = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th'];

export const VictoryModal: React.FC<VictoryModalProps> = ({
  visible,
  standings,
  tokens,
  stats,
  humanColor,
  onPlayAgain,
  onChangeSetup,
}) => {
  const humanPlace = standings.findIndex((p) => p.color === humanColor) + 1;
  const wonFirst = humanPlace === 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient
          colors={[WOODEN_THEME.frameInner, WOODEN_THEME.frameOuter]}
          style={styles.modalCard}
        >
          <Text style={styles.crownEmoji}>{wonFirst ? '👑' : '🏆'}</Text>
          <Text style={styles.headline}>
            {wonFirst ? 'GRAND VICTORY!' : `YOU PLACED #${humanPlace}`}
          </Text>
          <Text style={styles.subHeadline}>
            {wonFirst
              ? 'Masterfully played — all four pawns reached the center home!'
              : `${standings[0]?.name ?? 'Bot'} claimed the top spot this round.`}
          </Text>

          {/* Podium Standings */}
          <View style={styles.podiumList}>
            {standings.map((p, idx) => {
              const palette = HOUSE_COLORS[p.color];
              const pStats = stats[p.color];
              const homePawns = tokens.filter(
                (t) => t.color === p.color && t.step === 56
              ).length;

              return (
                <View
                  key={p.color}
                  style={[
                    styles.podiumRow,
                    p.color === humanColor && styles.humanRowHighlight,
                  ]}
                >
                  <Text style={styles.medalText}>{MEDALS[idx] ?? `${idx + 1}th`}</Text>
                  <View
                    style={[styles.colorDot, { backgroundColor: palette.primary }]}
                  />
                  <View style={styles.playerCol}>
                    <Text style={styles.playerName}>
                      {p.name} {!p.isBot ? '(You)' : ''}
                    </Text>
                    <Text style={styles.statLine}>
                      {homePawns}/4 Home • {pStats.captures} Captures • {pStats.sixes} Sixes
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.btnRow}>
            <Pressable onPress={onChangeSetup} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Setup</Text>
            </Pressable>
            <Pressable onPress={onPlayAgain} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Rematch</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 6, 2, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 410,
    borderRadius: 20,
    padding: 22,
    borderWidth: 2,
    borderColor: WOODEN_THEME.brassLight,
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: 42,
  },
  headline: {
    color: WOODEN_THEME.brassLight,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  subHeadline: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  podiumList: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WOODEN_THEME.brassDark,
    gap: 10,
  },
  humanRowHighlight: {
    borderColor: WOODEN_THEME.brassLight,
    backgroundColor: 'rgba(212, 168, 75, 0.16)',
  },
  medalText: {
    color: WOODEN_THEME.brassLight,
    fontSize: 13,
    fontWeight: '800',
    width: 52,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: WOODEN_THEME.creamText,
  },
  playerCol: {
    flex: 1,
  },
  playerName: {
    color: WOODEN_THEME.creamText,
    fontSize: 14,
    fontWeight: '800',
  },
  statLine: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 11.5,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: WOODEN_THEME.brassGold,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: WOODEN_THEME.creamText,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: WOODEN_THEME.brassGold,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: WOODEN_THEME.inkDark,
    fontSize: 14.5,
    fontWeight: '900',
  },
});
