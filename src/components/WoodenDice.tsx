import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import { PlayerColor } from '../types/ludo';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface WoodenDiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  turnColor: PlayerColor;
  isBotTurn: boolean;
  onRoll: () => void;
}

const PIP_LAYOUTS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

export const WoodenDice: React.FC<WoodenDiceProps> = ({
  value,
  isRolling,
  canRoll,
  turnColor,
  isBotTurn,
  onRoll,
}) => {
  const [rollingFace, setRollingFace] = useState<number>(value ?? 6);
  const [spinAnim] = useState(() => new Animated.Value(0));
  const [bounceAnim] = useState(() => new Animated.Value(1));
  const [promptPulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isRolling) return;

    let step = 0;
    const faceTimer = setInterval(() => {
      step += 1;
      setRollingFace(((step * 3 + Math.floor(Math.random() * 6)) % 6) + 1);
    }, 65);

    spinAnim.setValue(0);
    bounceAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.22,
          duration: 190,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start();

    return () => clearInterval(faceTimer);
  }, [isRolling, value, spinAnim, bounceAnim]);

  useEffect(() => {
    if (!canRoll || isBotTurn) {
      promptPulse.stopAnimation();
      promptPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(promptPulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(promptPulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [canRoll, isBotTurn, promptPulse]);

  const displayFace = isRolling ? rollingFace : value ?? 6;
  const pips = PIP_LAYOUTS[displayFace] ?? PIP_LAYOUTS[6];
  const palette = HOUSE_COLORS[turnColor];

  const rotate = spinAnim.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: ['0deg', '-22deg', '18deg', '0deg'],
  });

  const pulseScale = promptPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });

  return (
    <Pressable
      disabled={!canRoll || isBotTurn}
      onPress={onRoll}
      style={({ pressed }) => [
        styles.trayButton,
        {
          borderColor: canRoll && !isBotTurn ? WOODEN_THEME.brassLight : WOODEN_THEME.brassDark,
          backgroundColor:
            canRoll && !isBotTurn ? WOODEN_THEME.frameInner : WOODEN_THEME.frameOuter,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Roll wooden dice"
    >
      {/* Left House Emblem Strip */}
      <View style={[styles.colorRibbon, { backgroundColor: palette.primary }]} />

      <Animated.View
        style={[
          styles.diceWrapper,
          {
            transform: [
              { scale: Animated.multiply(bounceAnim, pulseScale) },
              { rotate },
            ],
          },
        ]}
      >
        <Svg width={54} height={54} viewBox="0 0 100 100">
          {/* Carved Bone / Ivory Beveled Cube */}
          <Rect
            x="5"
            y="8"
            width="90"
            height="88"
            rx="20"
            fill={WOODEN_THEME.diceShadow}
            opacity={0.5}
          />
          <Rect
            x="5"
            y="4"
            width="90"
            height="88"
            rx="20"
            fill={WOODEN_THEME.diceEdge}
            stroke={WOODEN_THEME.brassDark}
            strokeWidth="2.5"
          />
          <Rect
            x="11"
            y="9"
            width="78"
            height="76"
            rx="15"
            fill={WOODEN_THEME.diceIvory}
          />

          {/* Recessed Traditional Pips (Crimson 1 & 6 in classic heritage style!) */}
          {pips.map(([px, py], i) => {
            const isSingleAce = displayFace === 1;
            const isSix = displayFace === 6;
            const pipColor =
              isSingleAce || isSix
                ? WOODEN_THEME.dicePipCrimson
                : WOODEN_THEME.dicePipDark;
            const r = isSingleAce ? 13.5 : 8.5;
            return (
              <React.Fragment key={i}>
                <Circle cx={px} cy={py - 1} r={r} fill="rgba(0,0,0,0.22)" />
                <Circle cx={px} cy={py} r={r} fill={pipColor} />
              </React.Fragment>
            );
          })}
        </Svg>
      </Animated.View>

      <View style={styles.labelCol}>
        <Text style={styles.turnTitle} numberOfLines={1}>
          {isBotTurn ? `${palette.shortName} Bot` : 'Your Turn'}
        </Text>
        <Text
          style={[
            styles.actionLabel,
            {
              color:
                canRoll && !isBotTurn
                  ? WOODEN_THEME.brassLight
                  : WOODEN_THEME.mutedCream,
            },
          ]}
          numberOfLines={1}
        >
          {isRolling
            ? 'Rolling...'
            : canRoll && !isBotTurn
            ? 'TAP TO ROLL'
            : value !== null
            ? `Rolled ${value}`
            : 'Waiting...'}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  trayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 188,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    gap: 10,
  },
  colorRibbon: {
    width: 6,
    height: 44,
    borderRadius: 3,
  },
  diceWrapper: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelCol: {
    flexShrink: 1,
  },
  turnTitle: {
    color: WOODEN_THEME.creamText,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
