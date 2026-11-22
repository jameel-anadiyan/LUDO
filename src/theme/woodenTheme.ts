import { PlayerColor } from '../types/ludo';

export interface HousePalette {
  name: string;
  shortName: string;
  primary: string;
  light: string;
  dark: string;
  deepBorder: string;
  cellTint: string;
  yardBg: string;
  pawnHighlight: string;
  pawnRing: string;
}

export const WOODEN_THEME = {
  // Rich carved walnut / mahogany / parchment palette
  tabletopDark: '#160D07',
  tabletopMid: '#26160C',
  tabletopLight: '#351F11',

  // Carved board bevels
  frameOuter: '#3B200E',
  frameMid: '#5A3218',
  frameInner: '#734222',
  brassGold: '#D4A84B',
  brassLight: '#F0CF7B',
  brassDark: '#8F681E',

  // Maple & parchment playing surface
  cellLight: '#F8EFE0',
  cellAlt: '#EFE2CA',
  cellSafeSand: '#E8D3AE',
  gridStroke: '#8A6744',
  parchmentBg: '#F6ECDA',
  parchmentDark: '#E6D4B5',

  // Text colors
  inkDark: '#2B180A',
  inkMuted: '#694A30',
  creamText: '#FAF1E2',
  mutedCream: '#CBB292',

  // Dice ivory & pips
  diceIvory: '#FCF6E8',
  diceEdge: '#D8C3A0',
  diceShadow: '#4A2B13',
  dicePipDark: '#2D190B',
  dicePipCrimson: '#B6262C',
} as const;

export const HOUSE_COLORS: Record<PlayerColor, HousePalette> = {
  red: {
    name: 'Crimson Ruby',
    shortName: 'Red',
    primary: '#B6292E',
    light: '#DB4B50',
    dark: '#781519',
    deepBorder: '#540D10',
    cellTint: '#F3D4CE',
    yardBg: '#9E2227',
    pawnHighlight: '#F58589',
    pawnRing: '#FCE0A6',
  },
  green: {
    name: 'Forest Emerald',
    shortName: 'Green',
    primary: '#236E44',
    light: '#399662',
    dark: '#14472B',
    deepBorder: '#0C2F1C',
    cellTint: '#CFE6D7',
    pawnHighlight: '#72CA98',
    yardBg: '#1D5C38',
    pawnRing: '#FCE0A6',
  },
  yellow: {
    name: 'Royal Marigold',
    shortName: 'Gold',
    primary: '#C88717',
    light: '#E6A832',
    dark: '#8A5908',
    deepBorder: '#5E3B04',
    cellTint: '#F7E6C1',
    yardBg: '#B27712',
    pawnHighlight: '#FAD075',
    pawnRing: '#FFF5DC',
  },
  blue: {
    name: 'Indigo Sapphire',
    shortName: 'Blue',
    primary: '#24508E',
    light: '#3E73BD',
    dark: '#14325C',
    deepBorder: '#0C203D',
    cellTint: '#D1DFEF',
    yardBg: '#1D4378',
    pawnHighlight: '#7CA8E8',
    pawnRing: '#FCE0A6',
  },
};

export const CLOCKWISE_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const BOT_NAMES: Record<PlayerColor, string> = {
  red: 'Raja Vikram',
  green: ' Begum Noor'.trim(),
  yellow: 'Sardar Kabir',
  blue: 'Diwan Arjun',
};
