'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {OPEN_FREQ, OPEN_SEMITONE} from '@/lib/guitar';
import {tonePlayer} from '@/lib/notes/notes';
import {patternRoute} from '@/lib/scales/aug';
import type {AugPattern} from '@/lib/scales/aug';
import {useGuitarSamples} from '@/hooks/useGuitarSamples';
import QuizFretboard from './QuizFretboard';
import type {MarkedPos} from './QuizFretboard';
import ScaleFretboard from './ScaleFretboard';

function posSemi(s: number, f: number): number {
  return (OPEN_SEMITONE[s] + f) % 12;
}

function posFreq(s: number, f: number): number {
  return OPEN_FREQ[s] * Math.pow(2, f / 12);
}

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const SCALE_DEGREES = [1, 2, 3, 4, 5, 6, 7];

// 给定调性下，某 pitch class 是第几级（1–7），不是阶内音返回 null
function degreeOf(tonic: number, semi: number): number | null {
  const i = MAJOR_STEPS.findIndex((s) => (tonic + s) % 12 === semi);
  return i >= 0 ? i + 1 : null;
}

// 模块级随机取样：随机只在事件处理器/初始化时调用
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 随机打乱（只用在初始化/重置，运行期稳定）
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 指形 × 调性 的「找音」练习：选出一种指形后，在某个调下，
 * 依次出题「找到 N」。
 * 正确答案 = 第 N 级在这个指形（含所有可放置八度）内的全部位置；
 * 指形外的同音级算错并提示「这是 N 级，但不在这个指形里」。
 */
export default function PatternQuiz({
  pattern,
  tonic,
  keyName,
  patternName,
}: {
  pattern: AugPattern;
  tonic: number;
  keyName: string;
  patternName: string;
}) {
  const t = useTranslations('findNote');
  const {ready, loaded, total, failed} = useGuitarSamples();

  // 指定调下、该指形（含多八度全部音符与音级）——既是参考图的数据，也是「找到 N」的答案域
  const route = useMemo(() => patternRoute(pattern, tonic) ?? [], [pattern, tonic]);
  const byDegree = useMemo(() => {
    const m = new Map<number, {string: number; fret: number}[]>();
    route.forEach((e) => {
      const arr = m.get(e.degree);
      if (arr) arr.push({string: e.string, fret: e.fret});
      else m.set(e.degree, [{string: e.string, fret: e.fret}]);
    });
    return m;
  }, [route]);

  const [order, setOrder] = useState<number[]>(() => shuffle(SCALE_DEGREES));
  const [degIdx, setDegIdx] = useState(0);
  const [found, setFound] = useState<MarkedPos[]>([]);
  const [wrong, setWrong] = useState<MarkedPos[]>([]);
  const [wrongFlash, setWrongFlash] = useState('');
  const [revealed, setRevealed] = useState<{string: number; fret: number}[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showPattern, setShowPattern] = useState(true); // 练习上方的当前指形参考图

  const targetDegree: number | undefined = order[degIdx];
  // 正确答案 = 第 N 级在这个指形（含多八度）内的全部位置
  const targets: MarkedPos[] = (byDegree.get(targetDegree ?? -1) ?? []).map((p) => ({
    ...p,
    label: String(targetDegree),
  }));
  const markLabel = targetDegree === undefined ? '' : String(targetDegree);
  const remaining = targets.length - found.length;
  const degreeDone = targetDegree !== undefined && found.length >= targets.length;
  const done = targetDegree === undefined;

  const prompt = targetDegree === undefined ? '' : t('findDegree', {degree: targetDegree});

  const patternReachKey =
    pattern.reach && route[pattern.reach.noteIndex]
      ? `${route[pattern.reach.noteIndex].string}-${route[pattern.reach.noteIndex].fret}`
      : null;

  // 当前级全部找到 → 短暂展示后进下一级；全部级完成 → done
  useEffect(() => {
    if (!degreeDone || targetDegree === undefined) return;
    const id = window.setTimeout(() => {
      if (degIdx + 1 < order.length) {
        setDegIdx(degIdx + 1);
        setFound([]);
        setWrong([]);
        setRevealed([]);
        setWrongFlash('');
      } else {
        setDegIdx(order.length);
      }
    }, 1500);
    return () => window.clearTimeout(id);
  }, [degreeDone, targetDegree, degIdx, order.length]);

  useEffect(() => {
    if (!wrongFlash) return;
    const id = window.setTimeout(() => setWrongFlash(''), 900);
    return () => window.clearTimeout(id);
  }, [wrongFlash]);

  function handleClick(s: number, f: number) {
    if (targetDegree === undefined) return;
    if (found.some((p) => p.string === s && p.fret === f)) return;
    const semi = posSemi(s, f);
    const freq = posFreq(s, f);
    const hitDegree = degreeOf(tonic, semi);
    const hit = targets.some((p) => p.string === s && p.fret === f);
    if (hit) {
      tonePlayer.play(freq);
      setStreak((v) => v + 1);
      setCorrectCount((v) => v + 1);
      setFound((prev) => [...prev, {string: s, fret: f, label: markLabel}]);
    } else {
      tonePlayer.play(freq);
      setStreak(0);
      setWrongCount((v) => v + 1);
      setWrong((prev) => [
        ...prev.filter((p) => !(p.string === s && p.fret === f)),
        {string: s, fret: f, label: hitDegree === null ? '' : String(hitDegree)},
      ]);
      setWrongFlash(
        hitDegree === targetDegree
          ? t('wrongDegreeNotInShape', {degree: targetDegree})
          : hitDegree !== null
            ? t('wrongDegree', {hit: hitDegree, target: targetDegree})
            : t('wrongFlat'),
      );
      window.setTimeout(() => {
        setWrong((prev) => prev.filter((p) => !(p.string === s && p.fret === f)));
      }, 900);
    }
  }

  function giveHint() {
    if (targetDegree === undefined) return;
    const known = new Set([
      ...found.map((p) => `${p.string}-${p.fret}`),
      ...revealed.map((p) => `${p.string}-${p.fret}`),
    ]);
    const remainingPos = targets.filter((p) => !known.has(`${p.string}-${p.fret}`));
    if (remainingPos.length === 0) return;
    const hint = randomFrom(remainingPos);
    setRevealed((prev) => [...prev, {string: hint.string, fret: hint.fret}]);
  }

  function hearTarget() {
    if (targets.length === 0) return;
    const lowest = targets.reduce((a, b) =>
      posFreq(a.string, a.fret) <= posFreq(b.string, b.fret) ? a : b,
    );
    tonePlayer.play(posFreq(lowest.string, lowest.fret));
  }

  function skipDegree() {
    setRevealed([]);
    setWrong([]);
    setWrongFlash('');
    setFound([]);
    if (targetDegree === undefined) return;
    setDegIdx((i) => (i + 1 < order.length ? i + 1 : order.length));
  }

  function reset() {
    setOrder(shuffle(SCALE_DEGREES));
    setDegIdx(0);
    setFound([]);
    setWrong([]);
    setWrongFlash('');
    setRevealed([]);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
  }

  const smallBtn = () =>
    'rounded-xl border border-line bg-card-2 px-4 py-2 text-sm font-semibold text-text hover:brightness-110';

  return (
    <div className="mx-auto max-w-[640px]">
      {/* 当前指形参考图（可折叠；圆点内音级 + 下方音名，答题时可对照） */}
      <div className="mb-4 rounded-2xl border border-line bg-card p-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showPattern}
            onChange={(e) => setShowPattern(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t('showPattern')}
        </label>
        {showPattern && (
          <div className="mt-2">
            <ScaleFretboard
              notes={route}
              labels={route.map(() => '')}
              reachKey={patternReachKey}
              labelMode="degree"
              showFinger={false}
            />
          </div>
        )}
      </div>

      {/* 题干：指形 × 调性 · 1=根音 · 问题 */}
      <div className="mb-4 rounded-2xl border border-line bg-card p-6 text-center">
        <div className="text-sm text-muted">
          {patternName}
          <span className="mx-1.5 text-[#3a3e46]">×</span>
          {t('currentKey', {key: keyName})}
        </div>
        <div className="mt-2 text-2xl font-bold text-accent">1 = {keyName}</div>
        <div className="mt-3 min-h-[3.5rem]">
          {done ? (
            <div className="text-4xl font-extrabold leading-none text-accent-2">{t('done')}</div>
          ) : (
            <div className="text-5xl font-extrabold leading-none text-text">{prompt}</div>
          )}
        </div>
        <div className="mt-2 h-6 text-sm text-muted">
          {done ? `✓ ${correctCount} · ${wrongCount}` : degreeDone ? t('foundAll', {note: targetDegree ?? ''}) : wrongFlash || t('clickHint')}
        </div>
      </div>

      {/* 指板 */}
      <div className="mb-4 rounded-2xl border border-line bg-card p-4">
        <QuizFretboard
          found={found}
          wrong={wrong}
          revealed={revealed}
          onPositionClick={handleClick}
        />
        <div className="mt-2 text-center text-sm text-muted">
          {done
            ? `${t('correct')} ${correctCount} · ${t('wrong')} ${wrongCount}`
            : `${t('remaining', {n: remaining})} · ${t('correct')} ${correctCount} · ${t('wrong')} ${wrongCount} · ${t('streak')} ${streak}`}
        </div>
      </div>

      {!ready && (
        <div className="mb-3 text-center text-sm text-muted">
          {t('loadingSamples', {n: Math.round((loaded / total) * 100)})}
        </div>
      )}
      {failed && (
        <div className="mb-3 text-center text-sm text-accent">{t('sampleFailed')}</div>
      )}

      {/* 操作 */}
      {done ? (
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="rounded-xl bg-accent px-8 py-3 text-base font-bold text-[#0a0a0a] hover:brightness-110">
            {t('reset')}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={hearTarget} className={smallBtn()}>
            {t('hear')}
          </button>
          <button onClick={giveHint} disabled={remaining === 0} className={remaining === 0 ? 'cursor-not-allowed opacity-40 ' + smallBtn() : smallBtn()}>
            {t('hint')}
          </button>
          <button onClick={skipDegree} className={smallBtn()}>
            {t('skip')}
          </button>
          <button onClick={reset} className={smallBtn()}>
            {t('reset')}
          </button>
        </div>
      )}
    </div>
  );
}