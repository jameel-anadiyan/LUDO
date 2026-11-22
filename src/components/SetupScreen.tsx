import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CLOCKWISE_COLORS, HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import { AIDifficulty, GameSettings, PlayerColor } from '../types/ludo';

interface SetupScreenProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onStartGame: () => void;
  onOpenRules: () => void;
}

const DIFFICULTIES: Array<{ id: AIDifficulty; title: string; subtitle: string }> = [
  { id: 'easy', title: 'Apprentice', subtitle: 'Relaxed & forgiving' },
  { id: 'medium', title: 'Tactician', subtitle: 'Balanced classic AI' },
  { id: 'hard', title: 'Grandmaster', subtitle: 'Calculates odds & traps' },
];

const BOT_COUNTS: Array<{ count: 1 | 2 | 3; label: string; desc: string }> = [
  { count: 1, label: '1 Bot', desc: '1v1 Duel' },
  { count: 2, label: '2 Bots', desc: '3 Players' },
  { count: 3, label: '3 Bots', desc: 'Full 4P Board' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  settings,
  onUpdateSettings,
  onStartGame,
  onOpenRules,
}) => {
  const update = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: val });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Carved Wooden Crest Header */}
      <View style={styles.heroBox}>
        <Svg width={78} height={78} viewBox="0 0 100 100">
          <Rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="16"
            fill={WOODEN_THEME.frameMid}
            stroke={WOODEN_THEME.brassGold}
            strokeWidth="4"
          />
          <Rect x="14" y="14" width="34" height="34" rx="5" fill={HOUSE_COLORS.red.primary} />
          <Rect x="52" y="14" width="34" height="34" rx="5" fill={HOUSE_COLORS.green.primary} />
          <Rect x="14" y="52" width="34" height="34" rx="5" fill={HOUSE_COLORS.blue.primary} />
          <Rect x="52" y="52" width="34" height="34" rx="5" fill={HOUSE_COLORS.yellow.primary} />
          <Polygon
            points="50,28 72,50 50,72 28,50"
            fill={WOODEN_THEME.diceIvory}
            stroke={WOODEN_THEME.brassGold}
            strokeWidth="3"
          />
          <Circle cx="50" cy="50" r="7" fill={WOODEN_THEME.dicePipCrimson} />
        </Svg>
        <Text style={styles.gameTitle}>ROYAL WOODEN LUDO</Text>
        <Text style={styles.gameSubtitle}>
          Traditional Handcrafted Board • Single Player vs. AI
        </Text>
      </View>

      {/* Main Carved Walnut Setup Plaque */}
      <LinearGradient
        colors={[WOODEN_THEME.frameInner, WOODEN_THEME.frameOuter]}
        style={styles.card}
      >
        {/* 1. Choose House Color */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR HOUSE LACQUER</Text>
        <View style={styles.colorRow}>
          {CLOCKWISE_COLORS.map((color: PlayerColor) => {
            const palette = HOUSE_COLORS[color];
            const selected = settings.humanColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => update('humanColor', color)}
                style={[
                  styles.colorOption,
                  {
                    borderColor: selected
                      ? WOODEN_THEME.brassLight
                      : WOODEN_THEME.brassDark,
                    backgroundColor: selected
                      ? 'rgba(240, 207, 123, 0.16)'
                      : 'rgba(0, 0, 0, 0.22)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.pawnSwatch,
                    {
                      backgroundColor: palette.primary,
                      borderColor: selected ? WOODEN_THEME.brassLight : palette.dark,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pawnSwatchInner,
                      { backgroundColor: palette.light },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.colorName,
                    { color: selected ? WOODEN_THEME.brassLight : WOODEN_THEME.creamText },
                  ]}
                >
                  {palette.shortName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 2. Choose Number of AI Bots */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>OPPONENTS AT THE TABLE</Text>
        <View style={styles.optionRow}>
          {BOT_COUNTS.map((item) => {
            const selected = settings.botCount === item.count;
            return (
              <Pressable
                key={item.count}
                onPress={() => update('botCount', item.count)}
                style={[
                  styles.pillCard,
                  {
                    borderColor: selected
                      ? WOODEN_THEME.brassLight
                      : WOODEN_THEME.brassDark,
                    backgroundColor: selected
                      ? 'rgba(212, 168, 75, 0.22)'
                      : 'rgba(0, 0, 0, 0.22)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillTitle,
                    { color: selected ? WOODEN_THEME.brassLight : WOODEN_THEME.creamText },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.pillDesc}>{item.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. AI Difficulty */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>AI SKILL LEVEL</Text>
        <View style={styles.optionRow}>
          {DIFFICULTIES.map((diff) => {
            const selected = settings.difficulty === diff.id;
            return (
              <Pressable
                key={diff.id}
                onPress={() => update('difficulty', diff.id)}
                style={[
                  styles.pillCard,
                  {
                    borderColor: selected
                      ? WOODEN_THEME.brassLight
                      : WOODEN_THEME.brassDark,
                    backgroundColor: selected
                      ? 'rgba(212, 168, 75, 0.22)'
                      : 'rgba(0, 0, 0, 0.22)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillTitle,
                    { color: selected ? WOODEN_THEME.brassLight : WOODEN_THEME.creamText },
                  ]}
                >
                  {diff.title}
                </Text>
                <Text style={styles.pillDesc}>{diff.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 4. House Rules & Preferences */}
        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>TABLE PREFERENCES</Text>
        <View style={styles.toggleGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Safe Same-Color Pairs</Text>
              <Text style={styles.toggleSub}>
                Two stacked pawns of the same color cannot be captured
              </Text>
            </View>
            <Switch
              value={settings.safePairs}
              onValueChange={(v) => update('safePairs', v)}
              trackColor={{ false: '#3A2314', true: WOODEN_THEME.brassGold }}
              thumbColor={WOODEN_THEME.creamText}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Auto-Move Single Choice</Text>
              <Text style={styles.toggleSub}>
                Automatically move when only one unique play exists
              </Text>
            </View>
            <Switch
              value={settings.autoMoveSingle}
              onValueChange={(v) => update('autoMoveSingle', v)}
              trackColor={{ false: '#3A2314', true: WOODEN_THEME.brassGold }}
              thumbColor={WOODEN_THEME.creamText}
            />
          </View>
        </View>

        {/* Start Match Brass Button */}
        <Pressable
          onPress={onStartGame}
          style={({ pressed }) => [
            styles.startBtnWrapper,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[WOODEN_THEME.brassLight, WOODEN_THEME.brassGold, '#B6862C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startBtn}
          >
            <Text style={styles.startBtnText}>BEGIN CLASSIC MATCH</Text>
          </LinearGradient>
        </Pressable>

        {/* Rules Guide Link */}
        <Pressable onPress={onOpenRules} style={styles.rulesBtn}>
          <Text style={styles.rulesBtnText}>📜 Read Traditional Ludo Rules</Text>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  gameTitle: {
    color: WOODEN_THEME.brassLight,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginTop: 10,
    textAlign: 'center',
  },
  gameSubtitle: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: WOODEN_THEME.brassGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  sectionLabel: {
    color: WOODEN_THEME.brassGold,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pawnSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  pawnSwatchInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  pillTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pillDesc: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 10.5,
    marginTop: 3,
    textAlign: 'center',
  },
  toggleGroup: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: WOODEN_THEME.brassDark,
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: WOODEN_THEME.creamText,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: WOODEN_THEME.mutedCream,
    fontSize: 11,
    marginTop: 2,
  },
  startBtnWrapper: {
    marginTop: 22,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 14,
  },
  startBtnText: {
    color: WOODEN_THEME.inkDark,
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  rulesBtn: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rulesBtnText: {
    color: WOODEN_THEME.brassLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
