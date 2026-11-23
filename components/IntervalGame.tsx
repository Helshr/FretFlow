'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  C_INTERVAL_QUESTIONS,
  C_MAJOR_NOTES,
  INTERVAL_IDS,
  intervalById,
  intervalQKey,
} from '@/lib/intervals/cmajor';
import type {IntervalId, IntervalQuestion} from '@/lib/intervals/cmajor';
import IntervalTable from './IntervalTable';

const ROUND_LENGTH = 20; // 一轮固定 20 题
const TIME_CHOICES = [20, 10, 5, 3, 1];
const DEFAULT_TIMER = 10;

// 模块级随机：只在事件处理器/初始化时调用
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 把题目排成相邻不重复的顺序（池子只有 1 类时除外）
function arrangeNoAdjacent(list: IntervalQuestion[]): IntervalQuestion[] {
  if (list.length <= 1) return list;
  const used: IntervalQuestion[] = [];
  const counts = new Map<string, IntervalQuestion & {n: number}>();
  for (const q of list) {
    const k = intervalQKey(q);
    const e = counts.get(k);
    if (e) e.n++;
    else counts.set(k, {...q, n: 1});
  }
  while (used.length < list.length) {
    let bestKey: string | null = null;
    let bestN = -1;
    const prevKey = used.length ? intervalQKey(used[used.length - 1]) : null;
    for (const [k, e] of counts) {
      if (e.n === 0 || k === prevKey) continue;
      if (e.n > bestN) {
        bestN = e.n;
        bestKey = k;
      }
    }
    if (bestKey === null) {
      // 只剩当前相邻那类，只能接着放
      for (const [k, e] of counts) {
        if (e.n > 0) {
          bestKey = k;
          break;
        }
      }
    }
    const e = counts.get(bestKey!)!;
    used.push(e);
    e.n--;
  }
  return used;
}

// 一轮 n 道题：从勾选池子里先各保一条覆盖 7 个音名的题，其余随机；最后排成相邻不重复
function buildRound(n: number, pool: IntervalQuestion[]): IntervalQuestion[] {
  if (pool.length === 0) return [];
  const used = new Set<string>();
  const covered = C_MAJOR_NOTES.map((note) => {
    const q = pool.find(
      (x) => (x.low === note || x.high === note) && !used.has(intervalQKey(x)),
    );
    if (q) {
      used.add(intervalQKey(q));
      return q;
    }
    return undefined;
  }).filter((x): x is IntervalQuestion => x !== undefined);
  const rest = pool.filter((x) => !used.has(intervalQKey(x)));
  const distinct = shuffle([...covered, ...rest]);
  const multiset =
    n <= distinct.length
      ? distinct.slice(0, n)
      : [...distinct, ...Array.from({length: n - distinct.length}, () => randomFrom(pool))];
  return arrangeNoAdjacent(multiset);
}

function buildOptions(q: IntervalQuestion): IntervalId[] {
  const others = INTERVAL_IDS.filter((id) => id !== q.id);
  const d1 = randomFrom(others);
  const d2 = randomFrom(others.filter((o) => o !== d1));
  return shuffle([q.id, d1, d2]);
}

interface Game {
  round: IntervalQuestion[];
  index: number;
  options: IntervalId[];
}

function newGame(pool: IntervalQuestion[]): Game {
  const round = buildRound(ROUND_LENGTH, pool);
  return {round, index: 0, options: round[0] ? buildOptions(round[0]) : []};
}

type Phase = 'ready' | 'playing' | 'done';

/**
 * C 大调音程练习：一轮固定 20 题，随机两个自然音，3 选 1 选音程。
 * 点「开始」后进入答题；计时可在答题时随时切换（默认 10s）；
 * 答对闪绿 0.5s、答错/超时闪正确答案 0.7s。
 */
export default function IntervalGame() {
  const t = useTranslations('intervals');

  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  // 勾选的音程对（格子）的 key = `${low}-${high}`；默认全不选，点格子即加入（要练什么点哪几格）
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [timerSec, setTimerSec] = useState(DEFAULT_TIMER);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_TIMER * 1000);
  const [reveal, setReveal] = useState<IntervalId | null>(null);
  const [revealKind, setRevealKind] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [pickedWrong, setPickedWrong] = useState<IntervalId | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeoutCount, setTimeoutCount] = useState(0);

  const answeredRef = useRef(false);
  const goNextRef = useRef<() => void>(() => {});

  const {round, index, options} = game ?? {round: [], index: 0, options: [] as IntervalId[]};
  const current = round[index] ?? null;

  // 每题倒计时：切题/切限时都会重来；归零即视为超时 → 闪正确答案后下一题
  useEffect(() => {
    if (phase !== 'playing') return;
    const q = round[index];
    if (!q) return;
    const end = performance.now() + timerSec * 1000;
    const iv = window.setInterval(() => {
      const left = end - performance.now();
      if (left <= 0) {
        window.clearInterval(iv);
        if (!answeredRef.current) {
          answeredRef.current = true;
          setTimeoutCount((c) => c + 1);
          setReveal(q.id);
          setRevealKind('timeout');
          window.setTimeout(goNextRef.current, 700);
        }
      } else {
        setRemainingMs(left);
      }
    }, 200);
    return () => window.clearInterval(iv);
  }, [phase, index, timerSec, round]);

  function changeTimer(s: number) {
    setTimerSec(s);
    setRemainingMs(s * 1000); // 切限时同步重置当前题剩余
  }

  function goNext() {
    const next = index + 1;
    answeredRef.current = false;
    setReveal(null);
    setRevealKind(null);
    setPickedWrong(null);
    setRemainingMs(timerSec * 1000);
    if (next >= round.length) {
      setPhase('done');
      return;
    }
    setGame({round, index: next, options: buildOptions(round[next])});
  }

  // goNext 供倒计时/答题的 setTimeout 用上最新闭包
  useEffect(() => {
    goNextRef.current = goNext;
  });

  function handleAnswer(id: IntervalId) {
    if (answeredRef.current || !current) return;
    answeredRef.current = true;
    if (id === current.id) {
      setCorrectCount((c) => c + 1);
      // 答对也闪一下绿色（比错的快），显示「答对了」再下一题
      setReveal(current.id);
      setRevealKind('correct');
      setPickedWrong(null);
      window.setTimeout(goNextRef.current, 500);
    } else {
      setWrongCount((c) => c + 1);
      setPickedWrong(id);
      setReveal(current.id);
      setRevealKind('wrong');
      window.setTimeout(goNextRef.current, 700);
    }
  }

  function toggleCell(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  }

  function selectAll() {
    setSelectedKeys(C_INTERVAL_QUESTIONS.map((q) => intervalQKey(q)));
  }

  function start() {
    const pool = C_INTERVAL_QUESTIONS.filter((q) =>
      selectedKeys.includes(intervalQKey(q)),
    );
    if (pool.length === 0) return;
    setGame(newGame(pool));
    setPhase('playing');
    setCorrectCount(0);
    setWrongCount(0);
    setTimeoutCount(0);
    setReveal(null);
    setRevealKind(null);
    setPickedWrong(null);
    setRemainingMs(timerSec * 1000);
    answeredRef.current = false;
  }

  const optBtn = (id: IntervalId) => {
    const correct = reveal === id;
    const wrongPicked = pickedWrong === id;
    // 揭示时：正确答案只变绿字+绿边框，点错的只变红字+红边框（不整块变色）
    let cls = 'border border-line bg-card-2 text-text hover:brightness-110';
    if (correct) cls = 'border border-success bg-card-2 text-success';
    else if (wrongPicked) cls = 'border border-error bg-card-2 text-error';
    else if (reveal) cls = 'border border-line bg-card-2 text-[#3a3e46]';
    return cls;
  };

  if (phase === 'ready') {
    return (
      <div className="mx-auto max-w-[560px] text-center">
        <p className="mb-2 text-sm leading-relaxed text-muted">{t('subtitle')}</p>
        {/* 音程对照表 = 出题范围选择器 */}
        <IntervalTable selectedKeys={selectedKeys} onToggle={toggleCell} />
        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-full border border-line bg-card-2 px-4 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
          >
            {t('selectAll')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedKeys([])}
            className="rounded-full border border-line bg-card-2 px-4 py-1.5 text-xs font-semibold text-muted transition hover:text-text"
          >
            {t('clearAll')}
          </button>
        </div>
        <div className="mt-6">
          <button
            onClick={start}
            disabled={selectedKeys.length === 0}
            className={`rounded-full bg-accent px-12 py-4 text-lg font-bold text-[#0a0a0a] transition hover:-translate-y-0.5 hover:brightness-110 ${
              selectedKeys.length === 0 ? 'cursor-not-allowed opacity-40' : ''
            }`}
          >
            {t('start')}
          </button>
        </div>
        {selectedKeys.length === 0 && (
          <p className="mt-3 text-sm text-accent">{t('selectHint')}</p>
        )}
        <p className="mt-4 text-xs text-muted">{t('roundNote', {n: ROUND_LENGTH})}</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-[480px] text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-3 text-2xl font-bold">{t('done')}</h2>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="text-3xl font-bold text-accent-2">{correctCount}</div>
            <div className="mt-1 text-xs text-muted">{t('correct')}</div>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="text-3xl font-bold text-error">{wrongCount}</div>
            <div className="mt-1 text-xs text-muted">{t('wrong')}</div>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="text-3xl font-bold text-text">{timeoutCount}</div>
            <div className="mt-1 text-xs text-muted">{t('timeout')}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted">
          {t('score', {correct: correctCount, total: round.length})}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPhase('ready')}
            className="rounded-full border border-line bg-card-2 px-7 py-3 text-base font-semibold text-muted transition hover:text-text"
          >
            {t('backToSelect')}
          </button>
          <button
            onClick={start}
            className="rounded-full bg-accent px-8 py-3 text-base font-bold text-[#0a0a0a] hover:brightness-110"
          >
            {t('again')}
          </button>
        </div>
      </div>
    );
  }

  // playing
  const needHint = reveal !== null;
  return (
    <div className="mx-auto max-w-[520px]">
      {/* 计时切换 + 进度 + 倒计时 */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <span>{t('timeLimit')}</span>
          {TIME_CHOICES.map((s) => (
            <button
              key={s}
              onClick={() => changeTimer(s)}
              className={`min-w-8 rounded-lg px-2 py-1 text-xs font-bold transition ${
                timerSec === s
                  ? 'bg-accent text-[#0a0a0a]'
                  : 'border border-line bg-card-2 text-muted hover:text-text'
              }`}
            >
              {s}s
            </button>
          ))}
        </span>
        <span className="tabular-nums font-bold text-accent">
          {t('timeLeft', {sec: Math.max(1, Math.ceil(remainingMs / 1000))})}
        </span>
      </div>
      <div className="mb-4 flex items-center justify-between text-xs text-muted">
        <span>{t('questionOf', {n: index + 1, total: round.length})}</span>
        <span>
          {t('correct')} <span className="font-semibold text-accent-2">{correctCount}</span>
          <span className="mx-1.5 opacity-40">·</span>
          {t('wrong')} <span className="font-semibold text-error">{wrongCount}</span>
          <span className="mx-1.5 opacity-40">·</span>
          {t('timeout')} <span className="font-semibold text-text">{timeoutCount}</span>
        </span>
      </div>

      {/* 题干：两个音名 */}
      <div className="mb-5 rounded-2xl border border-line bg-card p-6 text-center">
        <div className="text-sm text-muted">{t('pickInterval')}</div>
        <div className="mt-2 flex items-center justify-center gap-4 text-5xl font-extrabold leading-none">
          <span className="text-text">{current?.low}</span>
          <span className="text-[#3a3e46]">→</span>
          <span className="text-accent">{current?.high}</span>
        </div>
      </div>

      {/* 选项 */}
      <div className="grid gap-3">
        {options.map((id) => (
          <button
            key={id}
            disabled={needHint}
            onClick={() => handleAnswer(id)}
            className={`rounded-xl px-4 py-3.5 text-lg font-semibold transition ${optBtn(id)}${
              needHint ? ' cursor-default' : ''
            }`}
          >
            {t(id)}
            <span className="ml-2 text-xs font-semibold opacity-70">
              {intervalById(id).abbr}
            </span>
          </button>
        ))}
      </div>

      {needHint && (
        <p className={`mt-3 text-center text-sm ${revealKind === 'correct' ? 'font-semibold text-success' : 'text-accent'}`}>
          {revealKind === 'correct' ? t('correctNote') : t('revealNote')}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted">{t('roundNote', {n: ROUND_LENGTH})}</p>
    </div>
  );
}