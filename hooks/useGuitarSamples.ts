'use client';

import {useEffect, useState} from 'react';
import {SAMPLE_COUNT, tonePlayer} from '@/lib/notes/notes';

// 预加载吉他采样；ready 之前应禁用开始按钮；failed=全部采样加载失败（在用合成音色）
export function useGuitarSamples() {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [ok, setOk] = useState(0);

  useEffect(() => {
    let cancelled = false;
    tonePlayer
      .preloadAll((n, total, okCount) => {
        if (!cancelled) {
          setLoaded(n);
          setOk(okCount);
        }
      })
      .then((okCount) => {
        if (!cancelled) {
          setReady(true);
          setOk(okCount);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {ready, loaded, total: SAMPLE_COUNT, failed: ready && ok === 0};
}
