import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import { GridPoint, TokenState } from '../types/ludo';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface ActiveHopSequence {
  tokenId: string;
  waypoints: ReadonlyArray<GridPoint>;
  onHopStep: () => void;
  onFinished: () => void;
}

interface PawnTokenProps {
  token: TokenState;
  cx: number;
  cy: number;
  baseScale: number;
  cellSize: number;
  isSelectable: boolean;
  activeHop: ActiveHopSequence | null;
  onPress: () => void;
}

export const PawnToken: React.FC<PawnTokenProps> = ({
  token,
  cx,
  cy,
  baseScale,
  cellSize,
  isSelectable,
  activeHop,
  onPress,
}) => {
  const pawnSize = cellSize * 0.88;
  const half = pawnSize / 2;

  const targetX = cx * cellSize - half;
  const targetY = cy * cellSize - half;

  const animX = useRef(new Animated.Value(targetX)).current;
  const animY = useRef(new Animated.Value(targetY)).current;
  const animBaseScale = useRef(new Animated.Value(baseScale)).current;
  const animHopScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const isThisTokenHopping = activeHop?.tokenId === token.id;
  const prevCellSizeRef = useRef(cellSize);

  // Immediately resync coordinates if screen/board resizes
  useEffect(() => {
    if (Math.abs(prevCellSizeRef.current - cellSize) > 0.5) {
      prevCellSizeRef.current = cellSize;
      animX.setValue(targetX);
      animY.setValue(targetY);
    }
  }, [cellSize, targetX, targetY, animX, animY]);

  // Smoothly spring resting tokens (e.g. stacking adjustments or captured pawns flying back to yard)
  useEffect(() => {
    if (isThisTokenHopping) return;

    Animated.parallel([
      Animated.spring(animX, {
        toValue: targetX,
        friction: 7,
        tension: 75,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(animY, {
        toValue: targetY,
        friction: 7,
        tension: 75,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(animBaseScale, {
        toValue: baseScale,
        duration: 180,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [targetX, targetY, baseScale, isThisTokenHopping, animX, animY, animBaseScale]);

  // Execute step-by-step cell hopping when this pawn is moving!
  useEffect(() => {
    if (!activeHop || activeHop.tokenId !== token.id) return;

    const { waypoints, onHopStep, onFinished } = activeHop;
    if (waypoints.length === 0) {
      onFinished();
      return;
    }

    // Bring scale to 1 while hopping
    animBaseScale.setValue(1);

    const hopDuration = waypoints.length > 4 ? 115 : 135;
    const timers: ReturnType<typeof setTimeout>[] = [];

    waypoints.forEach((_, idx) => {
      const t = setTimeout(() => {
        onHopStep();
      }, idx * hopDuration + 25);
      timers.push(t);
    });

    const stepAnimations = waypoints.map((pt) => {
      const wx = pt.cx * cellSize - half;
      const wy = pt.cy * cellSize - half;

      return Animated.parallel([
        Animated.timing(animX, {
          toValue: wx,
          duration: hopDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(animY, {
          toValue: wy,
          duration: hopDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.sequence([
          Animated.timing(animHopScale, {
            toValue: 1.32,
            duration: Math.round(hopDuration * 0.48),
            easing: Easing.out(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animHopScale, {
            toValue: 1.0,
            duration: Math.round(hopDuration * 0.52),
            easing: Easing.in(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]);
    });

    const seq = Animated.sequence(stepAnimations);
    seq.start(() => {
      timers.forEach(clearTimeout);
      onFinished();
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [activeHop, token.id, cellSize, half, animX, animY, animBaseScale, animHopScale]);

  // Golden selection pulse when player can tap this pawn
  useEffect(() => {
    if (!isSelectable) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 560,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 560,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isSelectable, pulseAnim]);

  const palette = HOUSE_COLORS[token.color];
  const selectBounce = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });
  const combinedScale = Animated.multiply(
    Animated.multiply(animBaseScale, animHopScale),
    selectBounce
  );

  return (
    <Animated.View
      pointerEvents={isSelectable ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          width: pawnSize,
          height: pawnSize,
          zIndex: isThisTokenHopping ? 40 : isSelectable ? 30 : 12 + token.tokenIndex,
          transform: [
            { translateX: animX },
            { translateY: animY },
            { scale: combinedScale },
          ],
        },
      ]}
    >
      <Pressable
        disabled={!isSelectable}
        onPress={onPress}
        hitSlop={10}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`${palette.shortName} pawn ${token.tokenIndex + 1}`}
      >
        <Svg width={pawnSize} height={pawnSize} viewBox="0 0 100 100">
          {/* Pulsing Golden Halo Ring when Selectable */}
          {isSelectable && (
            <Circle
              cx="50"
              cy="50"
              r="47"
              fill="rgba(240, 207, 123, 0.28)"
              stroke={WOODEN_THEME.brassLight}
              strokeWidth="5.5"
            />
          )}

          {/* Ground Drop Shadow */}
          <Ellipse cx="50" cy="60" rx="36" ry="33" fill="rgba(20, 10, 4, 0.46)" />

          {/* Lathe-Turned Wooden Base Rim */}
          <Circle
            cx="50"
            cy="52"
            r="36"
            fill={palette.dark}
            stroke={palette.deepBorder}
            strokeWidth="3.5"
          />

          {/* Lacquered Wooden Body */}
          <Circle cx="50" cy="49" r="31" fill={palette.primary} />

          {/* Carved Brass / Ivory Inlay Collar Ring */}
          <Circle
            cx="50"
            cy="47"
            r="22"
            fill={palette.light}
            stroke={palette.pawnRing}
            strokeWidth="2.8"
          />

          {/* Top Turned Wooden Knob Finial */}
          <Circle
            cx="50"
            cy="44"
            r="13.5"
            fill={palette.primary}
            stroke={palette.dark}
            strokeWidth="2"
          />

          {/* Specular Lacquer Wood Gloss Highlight */}
          <Ellipse
            cx="44"
            cy="39"
            rx="6.5"
            ry="4.2"
            fill={palette.pawnHighlight}
            opacity={0.85}
          />
        </Svg>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
