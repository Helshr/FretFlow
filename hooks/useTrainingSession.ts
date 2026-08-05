'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {makePool, pickNext} from '@/lib/chords/transpose';
import type {CagedShape, OpenChord, PoolItem, Settings} from '@/lib/chords/types';
import {useDrumMachine} from './useDrumMachine';
import openDataJson from '@/data/open_chords.json';
import cagedDataJson from '@/data/caged.json';

const openData = openDataJson as {chords: OpenChord[]};
const cagedData = cagedDataJson as {shapes: CagedShape[]};

export type SessionPhase = 'settings' | 'training' | 'done';

export function useTrainingSession() {
  const t = useTranslations('error');
  const drum = useDrumMachine();

  const [phase, setPhase] = useState<SessionPhase>('settings');
  const [mode, setMode] = useState<'open' | 'caged'>('open');
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [next, setNext] = useState<PoolItem | null>(null);
  const [timeText, setTimeText] = useState('05:00');
  const [paused, setPaused] = useState(false);

  // 计时/切换所需的可变值放 refs，避免鼓机 onBar 与 ticker 里的闭包过期
  const settingsRef = useRef<Settings>({
    mode: 'open',
    chordCount: 4,
    bpm: 80,
    measuresPerChord: 1,
    durationMin: 5,
  });
  const poolRef = useRef<PoolItem[]>([]);
  const currentRef = useRef<PoolItem | null>(null);
  const nextRef = useRef<PoolItem | null>(null);
  const barCountRef = useRef(0);
  const startedAtRef = useRef(0);
  const pausedTotalRef = useRef(0);
  const pausedAtRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function renderTime(ms: number) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    setTimeText(`${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
  }

  function advanceChord() {
    const cur = nextRef.current;
    if (!cur) return;
    currentRef.current = cur;
    nextRef.current = pickNext(poolRef.current, cur);
    setCurrent(cur);
    setNext(nextRef.current);
  }

  function onBar() {
    const m = settingsRef.current.measuresPerChord;
    barCountRef.current += 1;
    if (barCountRef.current > 1 && (barCountRef.current - 1) % m === 0) {
      advanceChord();
    }
  }

  function clearTicker() {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }

  function tick() {
    const settings = settingsRef.current;
    // eslint-disable-next-line react-hooks/purity -- tick 仅由 setInterval 调用，非渲染期
    const elapsed = performance.now() - startedAtRef.current - pausedTotalRef.current;
    const remaining = settings.durationMin * 60000 - elapsed;
    if (remaining <= 0) {
      renderTime(0);
      finish();
      return;
    }
    renderTime(remaining);
  }

  function finish() {
    setPhase('done');
    drum.stop();
    clearTicker();
  }

  function start(settings: Settings) {
    const pool = makePool(settings, openData, cagedData);
    if (pool.length === 0) {
      alert(t('emptyPool'));
      return;
    }
    settingsRef.current = settings;
    poolRef.current = pool;
    currentRef.current = pool[0];
    nextRef.current = pickNext(pool, pool[0]);
    setCurrent(pool[0]);
    setNext(nextRef.current);
    barCountRef.current = 0;
    startedAtRef.current = performance.now();
    pausedTotalRef.current = 0;
    setPaused(false);
    setMode(settings.mode);
    setPhase('training');
    renderTime(settings.durationMin * 60000);

    drum.start(settings.bpm, onBar);
    tickerRef.current = setInterval(tick, 200);
  }

  function togglePause() {
    if (phase === 'done') return;
    if (!paused) {
      setPaused(true);
      pausedAtRef.current = performance.now();
      drum.stop();
      clearTicker();
    } else {
      pausedTotalRef.current += performance.now() - pausedAtRef.current;
      setPaused(false);
      barCountRef.current = 0; // 鼓机相位重置到小节起点，重记小节数
      drum.start(settingsRef.current.bpm, onBar);
      tickerRef.current = setInterval(tick, 200);
    }
  }

  function stop() {
    setPhase('settings');
    setPaused(false);
    drum.stop();
    clearTicker();
  }

  useEffect(() => {
    return () => {
      drum.stop();
      clearTicker();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    mode,
    current,
    next,
    timeText,
    paused,
    start,
    togglePause,
    stop,
  };
}
