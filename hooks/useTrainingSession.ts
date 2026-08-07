'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {chordFrequencies, makePool, pickNext} from '@/lib/chords/transpose';
import type {CagedShape, OpenChord, PoolItem, Settings, ShapeFilter} from '@/lib/chords/types';
import {getAudioContext} from '@/lib/audio';
import {formatTime} from '@/lib/format';
import {tonePlayer} from '@/lib/notes/notes';
import {useDrumMachine} from './useDrumMachine';
import {useSessionTimers} from './useSessionTimers';
import openDataJson from '@/data/open_chords.json';
import cagedDataJson from '@/data/caged.json';

const openData = openDataJson as {chords: OpenChord[]};
const cagedData = cagedDataJson as {shapes: CagedShape[]};

export type SessionPhase = 'settings' | 'countdown' | 'training' | 'done';

export function useTrainingSession() {
  const t = useTranslations('error');
  const drum = useDrumMachine();
  const timers = useSessionTimers();

  const [phase, setPhase] = useState<SessionPhase>('settings');
  const [mode, setMode] = useState<'open' | 'caged'>('open');
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>('all');
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [next, setNext] = useState<PoolItem | null>(null);
  const [timeText, setTimeText] = useState('05:00');
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [measureBeats, setMeasureBeats] = useState(0);
  const [progress, setProgress] = useState(1);
  const [measuresPerChord, setMeasuresPerChord] = useState(1);
  const [bpm, setBpm] = useState(80);
  const [durationMin, setDurationMin] = useState(5);

  // 计时/切换所需的可变值放 refs，避免鼓机 onBar 与 ticker 里的闭包过期
  const settingsRef = useRef<Settings>({
    mode: 'open',
    shapeFilter: 'all',
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
    setSwitchCount((c) => c + 1);
    playCurrentChord(cur, when); // 采样已在上一次预加载 → 准时播放
    preloadChord(nextRef.current); // 后台预加载下一个和弦
  }

  function onBar(barTime: number) {
    const m = settingsRef.current.measuresPerChord;
    barCountRef.current += 1;
    // 每满 measuresPerChord 小节换一次和弦（去掉 >1 守卫，否则首个和弦会多占一小节）
    if (barCountRef.current % m === 0) {
      advanceChord(barTime);
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
    setProgress(Math.max(0, remaining / (settings.durationMin * 60000)));
    // 当前和弦组内的小节拍位置（用于节拍点动画）
    const beatMs = (60 / settings.bpm) * 1000;
    const chordMs = beatMs * 4 * settings.measuresPerChord;
    setMeasureBeats(Math.floor((elapsed % chordMs) / beatMs));
  }

  function stopAudio() {
    drum.stop();
    timers.clear();
  }

  function startAudio(bpm: number, patternId: string) {
    drum.start(bpm, onBar, patternId);
    timers.set(tick, 200);
  }

  function finish() {
    setPhase('done');
    stopAudio();
  }

  // 倒计时结束后的真正开始
  function beginTraining() {
    const settings = settingsRef.current;
    const pool = poolRef.current;
    startedAtRef.current = performance.now();
    setPhase('training');
    setSwitchCount(0);
    setMeasureBeats(0);
    setProgress(1);
    setTimeText(formatTime(settings.durationMin * 60000));
    playCurrentChord(pool[0]); // 初始和弦（采样已预加载，音频上下文已预建）
    preloadChord(nextRef.current!); // start() 已保证 next 存在
    startAudio(settings.bpm, settings.patternId);
  }

  function start(settings: Settings) {
    const pool = makePool(settings, openData, cagedData);
    if (pool.length === 0) {
      alert(t('emptyPool'));
      return;
    }
    settingsRef.current = settings;
    poolRef.current = pool;
    setPool(pool);
    currentRef.current = pool[0];
    nextRef.current = pickNext(pool, pool[0]);
    setCurrent(pool[0]);
    setNext(nextRef.current);
    barCountRef.current = 0;
    pausedTotalRef.current = 0;
    setPaused(false);
    setMode(settings.mode);
    setShapeFilter(settings.shapeFilter);
    setMeasuresPerChord(settings.measuresPerChord);
    setBpm(settings.bpm);
    setDurationMin(settings.durationMin);

    // 用户手势内预建音频上下文（倒计时结束后才能正常发声）
    getAudioContext();

    // 3-2-1 倒计时后再开始
    timers.clear();
    setPhase('countdown');
    setCountdown(3);
    let n = 3;
    timers.set(() => {
      n--;
      if (n <= 0) {
        timers.clear();
        setCountdown(null);
        beginTraining();
      } else {
        setCountdown(n);
      }
    }, 1000);
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
    setCountdown(null);
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
    shapeFilter,
    pool,
    current,
    next,
    timeText,
    paused,
    countdown,
    switchCount,
    measureBeats,
    progress,
    measuresPerChord,
    bpm,
    durationMin,
    start,
    togglePause,
    stop,
  };
}
