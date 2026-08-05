// 音符数据与播放助手（浏览器 API，均加 typeof window 守卫）

export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

// 音名 → 半音（C=0）
export const NOTE_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

// 空弦音（半音，C=0）与空弦基频（标准调弦）
export const OPEN_SEMITONE: Record<number, number> = { 6: 4, 5: 9, 4: 2, 3: 7, 2: 11, 1: 4 };
export const OPEN_FREQ: Record<number, number> = {
  6: 82.41, // E2
  5: 110.0, // A2
  4: 146.83, // D3
  3: 196.0, // G3
  2: 246.94, // B3
  1: 329.63, // E4
};

export interface NotePosition {
  string: number; // 6..1
  fret: number; // 0..12，0=空弦
  freq: number;
}

// 某音在所有弦 0..12 品的出现位置（6→1 弦，每弦内品位升序，含空弦）
export function notePositions(noteSemi: number): NotePosition[] {
  const target = ((noteSemi % 12) + 12) % 12;
  const out: NotePosition[] = [];
  for (let s = 6; s >= 1; s--) {
    for (let f = 0; f <= 12; f++) {
      if ((OPEN_SEMITONE[s] + f) % 12 === target) {
        out.push({string: s, fret: f, freq: OPEN_FREQ[s] * Math.pow(2, f / 12)});
      }
    }
  }
  return out;
}

// 语音念出音名
export function speakNote(note: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(note);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// Web Audio 单音合成
class TonePlayer {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(freq: number, duration = 0.4): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.02);
    gain.gain.setValueAtTime(0.6, now + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

export const tonePlayer = new TonePlayer();
