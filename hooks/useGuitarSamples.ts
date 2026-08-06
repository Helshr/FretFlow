'use client';

import {useEffect, useState} from 'react';
import {SAMPLE_COUNT, tonePlayer} from '@/lib/notes/notes';

// 预加载吉他采样；ready 之前应禁用开始按钮
export function useGuitarSamples() {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    tonePlayer
      .preloadAll((n) => {
        if (!cancelled) setLoaded(n);
      })
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {ready, loaded, total: SAMPLE_COUNT};
}
