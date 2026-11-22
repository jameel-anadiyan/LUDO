import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let webAudioCtx: AudioContext | null = null;

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    if (!webAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        webAudioCtx = new AudioCtx();
      }
    }
    if (webAudioCtx && webAudioCtx.state === 'suspended') {
      webAudioCtx.resume().catch(() => {});
    }
    return webAudioCtx;
  } catch {
    return null;
  }
}

function playWoodTone(freq: number, durationSec: number, gainPeak = 0.14, type: OscillatorType = 'triangle') {
  const ctx = getWebAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), now + durationSec);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.01);
  } catch {
    // Ignore audio errors gracefully
  }
}

export const Feedback = {
  diceRoll(soundEnabled: boolean, hapticsEnabled: boolean) {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (soundEnabled) {
      // Rapid wooden dice rattle
      [0, 55, 115, 180].forEach((ms, idx) => {
        setTimeout(() => {
          playWoodTone(320 + idx * 45, 0.045, 0.1, 'triangle');
        }, ms);
      });
    }
  },

  pawnHop(soundEnabled: boolean, hapticsEnabled: boolean) {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (soundEnabled) {
      playWoodTone(460, 0.055, 0.12, 'sine');
    }
  },

  capture(soundEnabled: boolean, hapticsEnabled: boolean) {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    if (soundEnabled) {
      playWoodTone(240, 0.16, 0.2, 'sawtooth');
      setTimeout(() => playWoodTone(165, 0.22, 0.18, 'triangle'), 90);
    }
  },

  reachGoal(soundEnabled: boolean, hapticsEnabled: boolean) {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (soundEnabled) {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        setTimeout(() => playWoodTone(freq, 0.16, 0.14, 'triangle'), i * 85);
      });
    }
  },

  victory(soundEnabled: boolean, hapticsEnabled: boolean) {
    if (hapticsEnabled && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (soundEnabled) {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => playWoodTone(freq, 0.24, 0.16, 'triangle'), i * 110);
      });
    }
  },
};
