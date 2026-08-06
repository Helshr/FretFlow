// 吉他采样播放器：真实采样（Cache API 持久缓存）+ 加法合成降级
import {getAudioContext} from '../audio';
import {
  CACHE_NAME,
  CHORD_GAIN,
  SAMPLE_BASE_URL,
  SAMPLE_COUNT,
  SAMPLE_GAIN,
  SAMPLES,
  nearestSample,
} from './samples';

export {SAMPLE_COUNT};

class TonePlayer {
  private cache = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private active = new Set<{source: AudioBufferSourceNode; gain: GainNode}>();

  // 停掉当前正在发声的音（切和弦/切音时调用，避免长采样余音重叠、新音卡不准拍）
  private stopAll(): void {
    const ctx = getAudioContext();
    const now = ctx ? ctx.currentTime : 0;
    this.active.forEach(({source, gain}) => {
      try {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        source.stop(now + 0.05);
      } catch {
        // 已自然结束则忽略
      }
    });
    this.active.clear();
  }

  // 登记一个发声节点，结束时自动移除；切音时由 stopAll 统一停掉
  private track(source: AudioBufferSourceNode, gain: GainNode): void {
    const pair = {source, gain};
    this.active.add(pair);
    source.onended = () => this.active.delete(pair);
  }

  // 取 WAV 的 ArrayBuffer：内存优先 → Cache API（持久）→ 网络，并写入 Cache API
  private async fetchWav(file: string): Promise<ArrayBuffer | null> {
    const url = SAMPLE_BASE_URL + file + '.wav';
    try {
      if (typeof caches !== 'undefined') {
        const store = await caches.open(CACHE_NAME);
        const hit = await store.match(url);
        if (hit) return await hit.arrayBuffer();
        const res = await fetch(url);
        if (!res.ok) return null;
        void store.put(url, res.clone());
        return await res.arrayBuffer();
      }
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  }

  // 加载并缓存采样（并发去重）
  private getBuffer(file: string): Promise<AudioBuffer | null> {
    const cached = this.cache.get(file);
    if (cached) return Promise.resolve(cached);
    const inflight = this.pending.get(file);
    if (inflight) return inflight;
    const p = this.load(file).then((buf) => {
      this.pending.delete(file);
      if (buf) this.cache.set(file, buf);
      return buf;
    });
    this.pending.set(file, p);
    return p;
  }

  private async load(file: string): Promise<AudioBuffer | null> {
    const ctx = getAudioContext();
    if (!ctx) return null;
    const arrayBuf = await this.fetchWav(file);
    if (!arrayBuf) return null;
    try {
      return await ctx.decodeAudioData(arrayBuf);
    } catch {
      return null;
    }
  }

  // 预加载指定频率对应的采样（不发声），保证之后 play 准时
  preload(freqs: number[]): void {
    freqs.forEach((f) => {
      if (f > 0) {
        const midi = Math.round(69 + 12 * Math.log2(f / 440));
        void this.getBuffer(nearestSample(midi).file);
      }
    });
  }

  // 预加载全部采样到 Cache API（不解码，省内存）；带进度回调。重复访问命中缓存会很快。
  // 返回成功加载的采样数（可用于诊断是否全部失败）
  async preloadAll(
    onProgress?: (loaded: number, total: number, ok: number) => void,
  ): Promise<number> {
    const total = SAMPLES.length;
    const useCache = typeof caches !== 'undefined';
    let i = 0;
    let done = 0;
    let ok = 0;
    const worker = async () => {
      while (i < total) {
        const file = SAMPLES[i].file;
        i++;
        const buf = useCache ? await this.fetchWav(file) : await this.getBuffer(file);
        if (buf) ok++;
        done++;
        onProgress?.(done, total, ok);
      }
    };
    await Promise.all(Array.from({length: 4}, () => worker()));
    return ok;
  }

  // 播放采样；成功返回 true，失败返回 false（由调用方降级）。when 为音频时间（可选，用于对准拍子）
  private async playSample(freq: number, gain: number, when?: number): Promise<boolean> {
    const ctx = getAudioContext();
    if (!ctx) return false;
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const {file, playbackRate} = nearestSample(midi);
    const buffer = await this.getBuffer(file);
    if (!buffer) return false;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate;
    g.gain.value = gain;
    src.connect(g);
    g.connect(ctx.destination);
    this.track(src, g);
    // 指定时刻在将来则对准播放，否则立即
    src.start(when !== undefined && when > ctx.currentTime ? when : undefined);
    return true;
  }

  // 加法合成（降级用）：基音 + 多个谐波，高次谐波衰减更快，快速起音模拟拨弦
  private tone(freq: number, peak: number, duration: number): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const partials = [
      {m: 1, a: 1.0, d: 1.0},
      {m: 2, a: 0.55, d: 0.7},
      {m: 3, a: 0.35, d: 0.5},
      {m: 4, a: 0.22, d: 0.35},
      {m: 5, a: 0.15, d: 0.28},
      {m: 6, a: 0.1, d: 0.22},
    ];
    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * p.m;
      const d = Math.max(0.1, duration * p.d);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak * p.a, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + d + 0.05);
    });
  }

  play(freq: number, duration = 0.4): void {
    this.stopAll();
    this.playSample(freq, SAMPLE_GAIN).then((ok) => {
      if (!ok) this.tone(freq, 0.6, duration);
    });
  }

  // 同时奏响多个音高（和弦）；单音音量调低避免削波。when 为音频时间（可选）
  playChord(freqs: number[], duration = 1.2, when?: number): void {
    this.stopAll();
    freqs.forEach((f) => {
      if (f > 0) {
        this.playSample(f, CHORD_GAIN, when).then((ok) => {
          if (!ok) this.tone(f, 0.35, duration);
        });
      }
    });
  }
}

export const tonePlayer = new TonePlayer();
