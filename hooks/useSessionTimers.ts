'use client';

import {useCallback, useEffect, useRef} from 'react';

// 统一管理会话里的所有 setInterval（倒计时、计时器），卸载时自动清理。
// set 注册一个 interval，clear 清掉全部（stop/pause/unmount 时调用）。
export function useSessionTimers() {
  const timersRef = useRef<number[]>([]);

  const set = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setInterval(fn, ms));
  }, []);

  const clear = useCallback(() => {
    timersRef.current.forEach((id) => window.clearInterval(id));
    timersRef.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  return {set, clear};
}
