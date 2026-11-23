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

// 一轮 n 道题：先各保一条覆盖 7 个音名的题，其余随机不重复；超出题库再随机补
function buildRound(n: number): IntervalQuestion[] {
  const used = new Set<string>();
  const covered = C_MAJOR_NOTES.map((note) => {
    const q = C_INTERVAL_QUESTIONS.find(
      (x) => (x.low === note || x.high === note) && !used.has(intervalQKey(x)),
    );
    if (q) {
      used.add(intervalQKey(q));
      return q;
    }
    return undefined;
  }).filter((x): x is IntervalQuestion => x !== undefined);
  const rest = C_INTERVAL_QUESTIONS.filter((x) => !used.has(intervalQKey(x)));
  const distinct = shuffle([...covered, ...rest]);
  if (n <= distinct.length) return shuffle(distinct.slice(0, n));
  const extra = Array.from({length: n - distinct.length}, () =>
    randomFrom(C_INTERVAL_QUESTIONS),
  );
  return shuffle([...distinct, ...extra]);
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

function newGame(): Game {
  const round = buildRound(ROUND_LENGTH);
  return {round, index: 0, options: buildOptions(round[0])};
}

type Phase = 'playing' | 'done';

/**
 * C 大调音程练习：进入即开始（一轮固定 20 题），随机两个自然音，3 选 1 选音程。
 * 计时可在答题中随时切换 1/3/5/7s；答对立即下一题，答错/超时闪正确答案 0.7s。
 */
export default function IntervalGame() {
  const t = useTranslations('intervals');

  const [game, setGame] = useState<Game | null>(null); // 挂载后再备题，避免 SSR/水合随机不一致
  const [phase, setPhase] = useState<Phase>('playing');
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

  // 进入页直接开局（挂载后延迟一拍，保证首次渲染可预测）
  useEffect(() => {
    const id = window.setTimeout(() => setGame(newGame()), 0);
    return () => window.clearTimeout(id);
  }, []);

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

  function restart() {
    setGame(newGame());
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

  if (!game) {
    return (
      <div className="mx-auto max-w-[520px] pt-12 text-center text-2xl text-[#3a3e46]">…</div>
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
        <button
          onClick={restart}
          className="mt-6 rounded-full bg-accent px-8 py-3 text-base font-bold text-[#0a0a0a] hover:brightness-110"
        >
          {t('again')}
        </button>
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