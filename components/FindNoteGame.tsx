'use client';

import {useCallback, useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {OPEN_FREQ, OPEN_SEMITONE} from '@/lib/guitar';
import {
  CHROMATIC_NOTES,
  notePositions,
  speakNote,
  tonePlayer,
} from '@/lib/notes/notes';
import {useGuitarSamples} from '@/hooks/useGuitarSamples';
import FindBoard from './FindBoard';
import type {MarkedPos} from './FindBoard';

export type NoteScope = '7' | '12';

const NATURAL_SEMIS = [0, 2, 4, 5, 7, 9, 11];

function poolFor(scope: NoteScope): number[] {
  return scope === '7' ? NATURAL_SEMIS : Array.from({length: 12}, (_, i) => i);
}

// 模块级随机取样：随机只在事件处理器/懒初始化时调用，避免在渲染期引入不稳定输出
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function posSemi(s: number, f: number): number {
  return (OPEN_SEMITONE[s] + f) % 12;
}

function posFreq(s: number, f: number): number {
  return OPEN_FREQ[s] * Math.pow(2, f / 12);
}

export default function FindNoteGame() {
  const t = useTranslations('findNote');
  const {ready, loaded, total, failed} = useGuitarSamples();

  const [scope, setScope] = useState<NoteScope>('7');
  const [target, setTarget] = useState<number | null>(() => randomFrom(poolFor('7')));
  const [found, setFound] = useState<MarkedPos[]>([]);
  const [wrong, setWrong] = useState<MarkedPos[]>([]);
  const [wrongFlash, setWrongFlash] = useState('');
  const [revealed, setRevealed] = useState<{string: number; fret: number}[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const totalPositions = target === null ? 0 : notePositions(target).length;
  const remaining = totalPositions - found.length;
  const targetName = target === null ? '' : CHROMATIC_NOTES[target];
  // 全部正确位置都找到即完成（派生状态，不需要额外 effect）
  const done = target !== null && found.length >= notePositions(target).length;

  const newNote = useCallback(
    (exclude: number | null) => {
      const pool = poolFor(scope);
      const candidates = pool.filter((n) => n !== exclude);
      setTarget(randomFrom(candidates));
      setFound([]);
      setWrong([]);
      setWrongFlash('');
      setRevealed([]);
    },
    [scope],
  );

  // 完成后短暂展示再自动进下一个音
  useEffect(() => {
    if (!done || target === null) return;
    const id = window.setTimeout(() => newNote(target), 2200);
    return () => window.clearTimeout(id);
  }, [done, target, newNote]);

  // 错误提示延迟消失
  useEffect(() => {
    if (!wrongFlash) return;
    const id = window.setTimeout(() => setWrongFlash(''), 900);
    return () => window.clearTimeout(id);
  }, [wrongFlash]);

  function handleClick(s: number, f: number) {
    if (done || target === null) return;
    const alreadyFound = found.some((p) => p.string === s && p.fret === f);
    if (alreadyFound) return;
    const semi = posSemi(s, f);
    const freq = posFreq(s, f);
    const label = CHROMATIC_NOTES[semi];
    if (semi === target) {
      tonePlayer.play(freq);
      setStreak((v) => v + 1);
      setCorrectCount((v) => v + 1);
      setFound((prev) => [...prev, {string: s, fret: f, label}]);
    } else {
      tonePlayer.play(freq);
      setStreak(0);
      setWrongCount((v) => v + 1);
      setWrong((prev) => [
        ...prev.filter((p) => !(p.string === s && p.fret === f)),
        {string: s, fret: f, label},
      ]);
      setWrongFlash(t('wrongMsg', {note: label, target: targetName}));
      window.setTimeout(() => {
        setWrong((prev) =>
          prev.filter((p) => !(p.string === s && p.fret === f)),
        );
      }, 900);
    }
  }

  function changeScope(next: NoteScope) {
    if (next === scope) return;
    setScope(next);
    const pick = randomFrom(poolFor(next));
    setTarget(pick);
    setFound([]);
    setWrong([]);
    setWrongFlash('');
    setRevealed([]);
  }

  function giveHint() {
    if (target === null || done) return;
    const positions = notePositions(target);
    const known = new Set([
      ...found.map((p) => `${p.string}-${p.fret}`),
      ...revealed.map((p) => `${p.string}-${p.fret}`),
    ]);
    const remainingPos = positions.filter((p) => !known.has(`${p.string}-${p.fret}`));
    if (remainingPos.length === 0) return;
    const hint = randomFrom(remainingPos);
    setRevealed((prev) => [...prev, {string: hint.string, fret: hint.fret}]);
  }

  function hearTarget() {
    if (target === null) return;
    speakNote(targetName);
    const positions = notePositions(target);
    const lowest = positions[positions.length - 1];
    tonePlayer.play(posFreq(lowest.string, lowest.fret));
  }

  function reset() {
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setWrongFlash('');
    newNote(null);
  }

  const segBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-accent text-[#0a0a0a]'
        : 'border border-line bg-card-2 text-muted hover:text-text'
    }`;
  const smallBtn = () =>
    'rounded-xl border border-line bg-card-2 px-4 py-2 text-sm font-semibold text-text hover:brightness-110';

  return (
    <div className="mx-auto max-w-[640px]">
      {/* 范围切换 */}
      <div className="mb-4 flex justify-center gap-2">
        {(['7', '12'] as NoteScope[]).map((s) => (
          <button key={s} onClick={() => changeScope(s)} className={segBtn(scope === s)}>
            {s === '7' ? t('scope7') : t('scope12')}
          </button>
        ))}
      </div>

      {/* 目标音名 */}
      <div className="mb-4 rounded-2xl border border-line bg-card p-6 text-center">
        <div className="text-sm text-muted">{t('target')}</div>
        <div className="mt-1 text-[4.5rem] font-extrabold leading-none text-accent">
          {targetName}
        </div>
        <div className="mt-2 h-6 text-sm text-muted">
          {done ? (
            <span className="font-semibold text-accent-2">{t('foundAll', {note: targetName})}</span>
          ) : wrongFlash ? (
            <span className="text-accent">{wrongFlash}</span>
          ) : (
            t('clickHint')
          )}
        </div>
      </div>

      {/* 指板 */}
      <div className="mb-4 rounded-2xl border border-line bg-card p-4">
        <FindBoard
          found={found}
          wrong={wrong}
          revealed={revealed}
          onPositionClick={handleClick}
        />
        <div className="mt-2 text-center text-sm text-muted">
          {done
            ? t('done')
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
          <button onClick={() => newNote(target)} className="rounded-xl bg-accent px-8 py-3 text-base font-bold text-[#0a0a0a] hover:brightness-110">
            {t('next')}
          </button>
          <button onClick={reset} className={smallBtn()}>
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
          <button onClick={() => newNote(target)} className={smallBtn()}>
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