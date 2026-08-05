// 共享 Web Audio 工具

let ctx: AudioContext | null = null;

// 全局唯一的输出 AudioContext（惰性创建、自动 resume、兼容 webkit）。
// 供合成类（TonePlayer / DrumMachine）复用，避免各自重复样板。
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
