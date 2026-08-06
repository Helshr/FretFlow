'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {chordFrequencies, makePool, pickNext} from '@/lib/chords/transpose';
import type {CagedShape, OpenChord, PoolItem, Settings} from '@/lib/chords/types';
import {formatTime} from '@/lib/format';
import {tonePlayer} from '@/lib/notes/notes';
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
    patternId: 'rock',
    playChord: true,
  });
  const poolRef = useRef<PoolItem[]>([]);
  const currentRef = useRef<PoolItem | null>(null);
  const nextRef = useRef<PoolItem | null>(null);
  const barCountRef = useRef(0);
  const startedAtRef = useRef(0);
  const pausedTotalRef = useRef(0);
  const pausedAtRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function playCurrentChord(c: PoolItem, when?: number) {
    if (settingsRef.current.playChord) {
      tonePlayer.playChord(chordFrequencies(c), undefined, when);
    }
  }

  function preloadChord(c: PoolItem) {
    if (settingsRef.current.playChord) {
      tonePlayer.preload(chordFrequencies(c));
    }
  }

  function advanceChord(when?: number) {
    const cur = nextRef.current;
    if (!cur) return;
    currentRef.current = cur;
    nextRef.current = pickNext(poolRef.current, cur);
    setCurrent(cur);
    setNext(nextRef.current);
    playCurrentChord(cur, when); // 采样已在上一次预加载 → 准时播放
    preloadChord(nextRef.current); // 后台预加载下一个和弦
  }

  function onBar(barTime: number) {
    const m = settingsRef.current.measuresPerChord;
    barCountRef.current += 1;
    if (barCountRef.current > 1 && (barCountRef.current - 1) % m === 0) {
      advanceChord(barTime);
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
      setTimeText(formatTime(0));
      finish();
      return;
    }
    setTimeText(formatTime(remaining));
  }

  function stopAudio() {
    drum.stop();
    clearTicker();
  }

  function startAudio(bpm: number, patternId: string) {
    drum.start(bpm, onBar, patternId);
    tickerRef.current = setInterval(tick, 200);
  }

  function finish() {
    setPhase('done');
    stopAudio();
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
    setTimeText(formatTime(settings.durationMin * 60000));

    playCurrentChord(pool[0]); // 初始和弦（采样已预加载，手势内初始化音频上下文）
    preloadChord(nextRef.current); // 后台预加载下一个和弦
    startAudio(settings.bpm, settings.patternId);
  }

  function togglePause() {
    if (phase === 'done') return;
    if (!paused) {
      setPaused(true);
      pausedAtRef.current = performance.now();
      stopAudio();
    } else {
      pausedTotalRef.current += performance.now() - pausedAtRef.current;
      setPaused(false);
      barCountRef.current = 0; // 鼓机相位重置到小节起点，重记小节数
      startAudio(settingsRef.current.bpm, settingsRef.current.patternId);
    }
  }

  function stop() {
    setPhase('settings');
    setPaused(false);
    stopAudio();
  }

  useEffect(() => {
    return () => {
      stopAudio();
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
