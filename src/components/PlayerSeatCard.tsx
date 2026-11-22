import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import { PlayerConfig, TokenState } from '../types/ludo';

interface PlayerSeatCardProps {
  player: PlayerConfig | undefined;
  isCurrentTurn: boolean;
  tokens: ReadonlyArray<TokenState>;
  finishRank: number | null; // 1, 2, 3, 4 if finished
  alignRight?: boolean;
}

const RANK_LABELS = ['', '1st', '2nd', '3rd', '4th'];

export const PlayerSeatCard: React.FC<PlayerSeatCardProps> = ({
  player,
  isCurrentTurn,
  tokens,
  finishRank,
  alignRight = false,
}) => {
  if (!player) {
    return <View style={styles.emptySlot} />;
  }

  const palette = HOUSE_COLORS[player.color];
  const myTokens = tokens.filter((t) => t.color === player.color);
  const homeCount = myTokens.filter((t) => t.step === 56).length;

  return (
    <View
      style={[
        styles.card,
        alignRight && styles.cardRight,
        {
          borderColor: isCurrentTurn ? WOODEN_THEME.brassLight : WOODEN_THEME.brassDark,
          backgroundColor: isCurrentTurn ? WOODEN_THEME.frameInner : WOODEN_THEME.frameOuter,
        },
      ]}
    >
      {/* Colored Lacquer Crest */}
      <View
        style={[
          styles.crest,
          {
            backgroundColor: palette.primary,
            borderColor: isCurrentTurn ? WOODEN_THEME.brassLight : palette.dark,
          },
        ]}
      >
        <Text style={styles.crestIcon}>
          {finishRank ? '♛' : player.isBot ? '⚙' : '★'}
        </Text>
      </View>

      <View style={[styles.infoCol, alignRight && styles.infoColRight]}>
        <View style={[styles.nameRow, alignRight && styles.rowReverse]}>
          <Text style={styles.nameText} numberOfLines={1}>
            {player.name}
          </Text>
          {finishRank !== null && (
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{RANK_LABELS[finishRank]}</Text>
            </View>
          )}
        </View>

        {/* 4 Mini Pawn Progress Pips */}
        <View style={[styles.pipRow, alignRight && styles.rowReverse]}>
          {[0, 1, 2, 3].map((i) => {
            const isHome = i < homeCount;
            return (
              <View
                key={i}
                style={[
                  styles.progressPip,
                  {
                    backgroundColor: isHome ? WOODEN_THEME.brassLight : 'rgba(255,255,255,0.14)',
                    borderColor: isHome ? WOODEN_THEME.brassGold : palette.light,
                  },
                ]}
              />
            );
          })}
          <Text style={styles.roleTag}>
            {player.isBot ? 'BOT' : 'YOU'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptySlot: {
    flex: 1,
    maxWidth: 162,
    height: 48,
  },
  card: {
    flex: 1,
    maxWidth: 168,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  cardRight: {
    flexDirection: 'row-reverse',
  },
  crest: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestIcon: {
    color: WOODEN_THEME.creamText,
    fontSize: 15,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    alignItems: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  nameText: {
    color: WOODEN_THEME.creamText,
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  rankBadge: {
    backgroundColor: WOODEN_THEME.brassGold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  rankText: {
    color: WOODEN_THEME.inkDark,
    fontSize: 9.5,
    fontWeight: '800',
  },
  pipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  progressPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleTag: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 9.5,
    fontWeight: '700',
    marginHorizontal: 3,
    letterSpacing: 0.4,
  },
});
