import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Rect,
  Polygon,
  Circle,
  Line,
  Path,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { HOUSE_COLORS, WOODEN_THEME } from '../theme/woodenTheme';
import {
  HOME_STRETCH_CELLS,
  OUTER_TRACK_CELLS,
  STAR_TRACK_INDICES,
  START_TRACK_INDEX,
  YARD_SOCKETS,
  getStepGridPoint,
} from '../engine/boardGeometry';
import { MoveOption, PlayerColor } from '../types/ludo';

interface WoodenBoardProps {
  boardSize: number;
  activeColors: ReadonlyArray<PlayerColor>;
  currentTurnColor: PlayerColor;
  validMoves: ReadonlyArray<MoveOption>;
  isHumanSelecting: boolean;
  onSelectMove: (move: MoveOption) => void;
  children?: React.ReactNode;
}

/**
 * Generate SVG points string for an 8-point compass star centered at (cx, cy)
 */
function buildEightPointStar(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildArrowPath(
  cx: number,
  cy: number,
  size: number,
  dir: 'right' | 'down' | 'left' | 'up'
): string {
  const s = size;
  switch (dir) {
    case 'right':
      return `M ${cx - s * 0.65} ${cy} L ${cx + s * 0.55} ${cy} M ${cx + s * 0.1} ${cy - s * 0.45} L ${cx + s * 0.6} ${cy} L ${cx + s * 0.1} ${cy + s * 0.45}`;
    case 'down':
      return `M ${cx} ${cy - s * 0.65} L ${cx} ${cy + s * 0.55} M ${cx - s * 0.45} ${cy + s * 0.1} L ${cx} ${cy + s * 0.6} L ${cx + s * 0.45} ${cy + s * 0.1}`;
    case 'left':
      return `M ${cx + s * 0.65} ${cy} L ${cx - s * 0.55} ${cy} M ${cx - s * 0.1} ${cy - s * 0.45} L ${cx - s * 0.6} ${cy} L ${cx - s * 0.1} ${cy + s * 0.45}`;
    case 'up':
      return `M ${cx} ${cy + s * 0.65} L ${cx} ${cy - s * 0.55} M ${cx - s * 0.45} ${cy - s * 0.1} L ${cx} ${cy - s * 0.6} L ${cx + s * 0.45} ${cy - s * 0.1}`;
  }
}

export const WoodenBoard: React.FC<WoodenBoardProps> = ({
  boardSize,
  activeColors,
  currentTurnColor,
  validMoves,
  isHumanSelecting,
  onSelectMove,
  children,
}) => {
  const framePad = Math.max(8, Math.round(boardSize * 0.028));
  const gridSize = boardSize - framePad * 2;
  const cell = gridSize / 15;

  const activeSet = useMemo(() => new Set(activeColors), [activeColors]);

  // Unique destination cells when human is choosing a move (allows tapping target cell too!)
  const uniqueDestMoves = useMemo(() => {
    if (!isHumanSelecting || validMoves.length === 0) return [];
    const byDest = new Map<string, MoveOption[]>();
    for (const m of validMoves) {
      const pt = getStepGridPoint(m.color, m.toStep, m.tokenIndex);
      const key = `${m.toStep}`;
      const list = byDest.get(key) ?? [];
      list.push(m);
      byDest.set(key, list);
      void pt;
    }
    return Array.from(byDest.values()).map((group) => group[0]);
  }, [isHumanSelecting, validMoves]);

  const yardExitMove = useMemo(() => {
    if (!isHumanSelecting) return undefined;
    return validMoves.find((m) => m.isExitYard);
  }, [isHumanSelecting, validMoves]);

  const yards: Array<{ color: PlayerColor; x0: number; y0: number }> = [
    { color: 'red', x0: 0, y0: 0 },
    { color: 'green', x0: 9, y0: 0 },
    { color: 'yellow', x0: 9, y0: 9 },
    { color: 'blue', x0: 0, y0: 9 },
  ];

  const startCells: Array<{
    color: PlayerColor;
    trackIdx: number;
    dir: 'right' | 'down' | 'left' | 'up';
  }> = [
    { color: 'red', trackIdx: START_TRACK_INDEX.red, dir: 'right' },
    { color: 'green', trackIdx: START_TRACK_INDEX.green, dir: 'down' },
    { color: 'yellow', trackIdx: START_TRACK_INDEX.yellow, dir: 'left' },
    { color: 'blue', trackIdx: START_TRACK_INDEX.blue, dir: 'up' },
  ];

  const homeTurnArrows: Array<{
    row: number;
    col: number;
    color: PlayerColor;
    dir: 'right' | 'down' | 'left' | 'up';
  }> = [
    { row: 7, col: 0, color: 'red', dir: 'right' },
    { row: 0, col: 7, color: 'green', dir: 'down' },
    { row: 7, col: 14, color: 'yellow', dir: 'left' },
    { row: 14, col: 7, color: 'blue', dir: 'up' },
  ];

  return (
    <View style={[styles.outerShadow, { width: boardSize, height: boardSize }]}>
      <LinearGradient
        colors={[WOODEN_THEME.frameInner, WOODEN_THEME.frameMid, WOODEN_THEME.frameOuter]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.woodFrame,
          {
            width: boardSize,
            height: boardSize,
            padding: framePad,
            borderRadius: Math.max(12, boardSize * 0.035),
          },
        ]}
      >
        {/* Corner Brass Rivets */}
        <View style={[styles.rivet, { top: 4, left: 4 }]} />
        <View style={[styles.rivet, { top: 4, right: 4 }]} />
        <View style={[styles.rivet, { bottom: 4, left: 4 }]} />
        <View style={[styles.rivet, { bottom: 4, right: 4 }]} />

        {/* Inner 15x15 Playing Surface */}
        <View style={[styles.gridContainer, { width: gridSize, height: gridSize }]}>
          <Svg width={gridSize} height={gridSize}>
            <Defs>
              <SvgLinearGradient id="parchmentGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FAF2E4" />
                <Stop offset="100%" stopColor="#EFE0C4" />
              </SvgLinearGradient>
              <SvgLinearGradient id="brassCenter" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={WOODEN_THEME.brassLight} />
                <Stop offset="50%" stopColor={WOODEN_THEME.brassGold} />
                <Stop offset="100%" stopColor={WOODEN_THEME.brassDark} />
              </SvgLinearGradient>
            </Defs>

            {/* Base Board Parchment */}
            <Rect x={0} y={0} width={gridSize} height={gridSize} fill="url(#parchmentGrad)" />

            {/* 52 Outer Track Squares */}
            {OUTER_TRACK_CELLS.map(([row, col], idx) => {
              const isAlt = (row + col) % 2 === 1;
              return (
                <Rect
                  key={`track-${idx}`}
                  x={col * cell}
                  y={row * cell}
                  width={cell}
                  height={cell}
                  fill={isAlt ? WOODEN_THEME.cellAlt : WOODEN_THEME.cellLight}
                  stroke={WOODEN_THEME.gridStroke}
                  strokeWidth={0.85}
                />
              );
            })}

            {/* Subtle Home-Stretch Turn Chevrons */}
            {homeTurnArrows.map(({ row, col, color, dir }) => {
              const cx = (col + 0.5) * cell;
              const cy = (row + 0.5) * cell;
              return (
                <Path
                  key={`turn-${color}`}
                  d={buildArrowPath(cx, cy, cell * 0.34, dir)}
                  stroke={HOUSE_COLORS[color].primary}
                  strokeWidth={Math.max(1.5, cell * 0.075)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.72}
                />
              );
            })}

            {/* 4 Colored Start Squares (Safe) */}
            {startCells.map(({ color, trackIdx, dir }) => {
              const [row, col] = OUTER_TRACK_CELLS[trackIdx];
              const cx = (col + 0.5) * cell;
              const cy = (row + 0.5) * cell;
              const palette = HOUSE_COLORS[color];
              return (
                <G key={`start-${color}`}>
                  <Rect
                    x={col * cell}
                    y={row * cell}
                    width={cell}
                    height={cell}
                    fill={palette.primary}
                    stroke={WOODEN_THEME.gridStroke}
                    strokeWidth={0.9}
                  />
                  <Rect
                    x={col * cell + cell * 0.08}
                    y={row * cell + cell * 0.08}
                    width={cell * 0.84}
                    height={cell * 0.84}
                    fill="none"
                    stroke={WOODEN_THEME.brassLight}
                    strokeWidth={0.8}
                    opacity={0.65}
                  />
                  <Path
                    d={buildArrowPath(cx, cy, cell * 0.38, dir)}
                    stroke={WOODEN_THEME.creamText}
                    strokeWidth={Math.max(1.8, cell * 0.09)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </G>
              );
            })}

            {/* 4 Engraved Star Safe Squares */}
            {STAR_TRACK_INDICES.map((trackIdx) => {
              const [row, col] = OUTER_TRACK_CELLS[trackIdx];
              const cx = (col + 0.5) * cell;
              const cy = (row + 0.5) * cell;
              return (
                <G key={`star-${trackIdx}`}>
                  <Rect
                    x={col * cell}
                    y={row * cell}
                    width={cell}
                    height={cell}
                    fill={WOODEN_THEME.cellSafeSand}
                    stroke={WOODEN_THEME.gridStroke}
                    strokeWidth={0.9}
                  />
                  <Polygon
                    points={buildEightPointStar(cx, cy, cell * 0.38, cell * 0.17)}
                    fill={WOODEN_THEME.brassGold}
                    stroke={WOODEN_THEME.brassDark}
                    strokeWidth={0.9}
                  />
                  <Circle cx={cx} cy={cy} r={cell * 0.08} fill={WOODEN_THEME.creamText} />
                </G>
              );
            })}

            {/* 4 Colored Home Stretch Columns (5 cells each) */}
            {(Object.keys(HOME_STRETCH_CELLS) as PlayerColor[]).map((color) => {
              const palette = HOUSE_COLORS[color];
              return HOME_STRETCH_CELLS[color].map(([row, col], stepIdx) => (
                <G key={`hs-${color}-${stepIdx}`}>
                  <Rect
                    x={col * cell}
                    y={row * cell}
                    width={cell}
                    height={cell}
                    fill={palette.primary}
                    stroke={WOODEN_THEME.gridStroke}
                    strokeWidth={0.9}
                  />
                  <Rect
                    x={col * cell + cell * 0.11}
                    y={row * cell + cell * 0.11}
                    width={cell * 0.78}
                    height={cell * 0.78}
                    rx={cell * 0.08}
                    fill="none"
                    stroke={WOODEN_THEME.brassLight}
                    strokeWidth={0.75}
                    opacity={0.45}
                  />
                </G>
              ));
            })}

            {/* 4 Corner Yards (6x6 each) */}
            {yards.map(({ color, x0, y0 }) => {
              const palette = HOUSE_COLORS[color];
              const isActive = activeSet.has(color);
              const isCurrent = currentTurnColor === color;
              const xPx = x0 * cell;
              const yPx = y0 * cell;
              const sizePx = 6 * cell;
              const innerInset = cell * 0.78;

              return (
                <G key={`yard-${color}`} opacity={isActive ? 1 : 0.78}>
                  {/* Lacquer Wood Border */}
                  <Rect
                    x={xPx}
                    y={yPx}
                    width={sizePx}
                    height={sizePx}
                    fill={palette.yardBg}
                    stroke={WOODEN_THEME.frameOuter}
                    strokeWidth={1.6}
                  />
                  {/* Active Turn Brass Highlight */}
                  <Rect
                    x={xPx + cell * 0.18}
                    y={yPx + cell * 0.18}
                    width={sizePx - cell * 0.36}
                    height={sizePx - cell * 0.36}
                    rx={cell * 0.22}
                    fill="none"
                    stroke={isCurrent ? WOODEN_THEME.brassLight : WOODEN_THEME.brassGold}
                    strokeWidth={isCurrent ? 2.4 : 1.0}
                    opacity={isCurrent ? 1 : 0.55}
                  />
                  {/* Inner Recessed Parchment Court */}
                  <Rect
                    x={xPx + innerInset}
                    y={yPx + innerInset}
                    width={sizePx - innerInset * 2}
                    height={sizePx - innerInset * 2}
                    rx={cell * 0.38}
                    fill={WOODEN_THEME.parchmentBg}
                    stroke={palette.deepBorder}
                    strokeWidth={1.5}
                  />
                  {/* Center Decorative Brass Diamond inside Yard */}
                  <Polygon
                    points={`${(x0 + 3) * cell},${(y0 + 2.55) * cell} ${(x0 + 3.45) * cell},${(y0 + 3) * cell} ${(x0 + 3) * cell},${(y0 + 3.45) * cell} ${(x0 + 2.55) * cell},${(y0 + 3) * cell}`}
                    fill={palette.cellTint}
                    stroke={WOODEN_THEME.brassDark}
                    strokeWidth={0.9}
                  />
                  {/* 4 Turned Wooden Token Wells */}
                  {YARD_SOCKETS[color].map((pt, sIdx) => (
                    <G key={`socket-${color}-${sIdx}`}>
                      <Circle
                        cx={pt.cx * cell}
                        cy={pt.cy * cell}
                        r={cell * 0.52}
                        fill={palette.deepBorder}
                        opacity={0.85}
                      />
                      <Circle
                        cx={pt.cx * cell}
                        cy={pt.cy * cell}
                        r={cell * 0.44}
                        fill={isActive ? palette.cellTint : WOODEN_THEME.parchmentDark}
                        stroke={WOODEN_THEME.brassGold}
                        strokeWidth={1.1}
                      />
                    </G>
                  ))}
                </G>
              );
            })}

            {/* Center 3x3 Home Goal Mitered Triangles */}
            <G>
              {/* Left = Red */}
              <Polygon
                points={`${6 * cell},${6 * cell} ${7.5 * cell},${7.5 * cell} ${6 * cell},${9 * cell}`}
                fill={HOUSE_COLORS.red.primary}
              />
              {/* Top = Green */}
              <Polygon
                points={`${6 * cell},${6 * cell} ${9 * cell},${6 * cell} ${7.5 * cell},${7.5 * cell}`}
                fill={HOUSE_COLORS.green.primary}
              />
              {/* Right = Yellow */}
              <Polygon
                points={`${9 * cell},${6 * cell} ${9 * cell},${9 * cell} ${7.5 * cell},${7.5 * cell}`}
                fill={HOUSE_COLORS.yellow.primary}
              />
              {/* Bottom = Blue */}
              <Polygon
                points={`${6 * cell},${9 * cell} ${9 * cell},${9 * cell} ${7.5 * cell},${7.5 * cell}`}
                fill={HOUSE_COLORS.blue.primary}
              />
              {/* Brass Miter Lines & Border */}
              <Rect
                x={6 * cell}
                y={6 * cell}
                width={3 * cell}
                height={3 * cell}
                fill="none"
                stroke={WOODEN_THEME.brassGold}
                strokeWidth={1.8}
              />
              <Line
                x1={6 * cell}
                y1={6 * cell}
                x2={9 * cell}
                y2={9 * cell}
                stroke={WOODEN_THEME.brassGold}
                strokeWidth={1.5}
              />
              <Line
                x1={9 * cell}
                y1={6 * cell}
                x2={6 * cell}
                y2={9 * cell}
                stroke={WOODEN_THEME.brassGold}
                strokeWidth={1.5}
              />
              {/* Central Carved Brass Rosette */}
              <Circle
                cx={7.5 * cell}
                cy={7.5 * cell}
                r={cell * 0.42}
                fill="url(#brassCenter)"
                stroke={WOODEN_THEME.frameOuter}
                strokeWidth={1.3}
              />
              <Polygon
                points={buildEightPointStar(7.5 * cell, 7.5 * cell, cell * 0.28, cell * 0.12)}
                fill={WOODEN_THEME.creamText}
              />
            </G>

            {/* Destination Square Preview Indicators for Human Player */}
            {uniqueDestMoves.map((m) => {
              const destPt = getStepGridPoint(m.color, m.toStep, m.tokenIndex);
              const isCapture = m.capturedTokenIds.length > 0;
              return (
                <Circle
                  key={`dest-ring-${m.tokenId}-${m.toStep}`}
                  cx={destPt.cx * cell}
                  cy={destPt.cy * cell}
                  r={cell * 0.34}
                  fill={isCapture ? 'rgba(219, 75, 80, 0.32)' : 'rgba(240, 207, 123, 0.36)'}
                  stroke={isCapture ? '#FF6B6B' : WOODEN_THEME.brassLight}
                  strokeWidth={2}
                  strokeDasharray="3,2"
                />
              );
            })}
          </Svg>

          {/* Convenient Yard Tap Zone when Human rolled 6 and can exit Yard */}
          {yardExitMove && (
            <Pressable
              onPress={() => onSelectMove(yardExitMove)}
              style={{
                position: 'absolute',
                left:
                  (yardExitMove.color === 'green' || yardExitMove.color === 'yellow' ? 9 : 0) *
                  cell,
                top:
                  (yardExitMove.color === 'blue' || yardExitMove.color === 'yellow' ? 9 : 0) *
                  cell,
                width: 6 * cell,
                height: 6 * cell,
                zIndex: 5,
              }}
              accessibilityRole="button"
              accessibilityLabel="Deploy pawn from yard"
            />
          )}

          {/* Destination Cell Tap Zones (when unambiguous) */}
          {uniqueDestMoves.map((m) => {
            const sameDestCount = validMoves.filter((vm) => vm.toStep === m.toStep && !vm.isExitYard).length;
            if (sameDestCount !== 1 || m.isExitYard) return null;
            const destPt = getStepGridPoint(m.color, m.toStep, m.tokenIndex);
            return (
              <Pressable
                key={`dest-hit-${m.tokenId}`}
                onPress={() => onSelectMove(m)}
                style={{
                  position: 'absolute',
                  left: (destPt.cx - 0.5) * cell,
                  top: (destPt.cy - 0.5) * cell,
                  width: cell,
                  height: cell,
                  zIndex: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel="Move pawn to highlighted square"
              />
            );
          })}

          {/* Animated Pawns & Effects Overlay */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {children}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  woodFrame: {
    borderWidth: 2,
    borderColor: WOODEN_THEME.brassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rivet: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: WOODEN_THEME.brassGold,
    borderWidth: 0.8,
    borderColor: WOODEN_THEME.frameOuter,
  },
  gridContainer: {
    borderWidth: 2,
    borderColor: WOODEN_THEME.brassGold,
    overflow: 'hidden',
    backgroundColor: WOODEN_THEME.parchmentBg,
  },
});
