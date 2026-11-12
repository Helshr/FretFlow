'use client';

import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {CHROMATIC_NOTES} from '@/lib/notes/notes';
import {AUG_PATTERNS, entryName, patternRoute} from '@/lib/scales/aug';
import ScaleFretboard, {DEGREE_COLORS} from './ScaleFretboard';
import PatternQuiz from './PatternQuiz';

// 指形页：两种模式。
// - 查看：切指形、切 12 调，查看该指形覆盖的全部音符（音级/音名/指法可切换）。
// - 找音练习：当前指形 × 调性下，逐个指出「第 N 级音」在指形内的位置。
export default function ScaleTrainer() {
  const t = useTranslations('scales');

  const [mode, setMode] = useState<'view' | 'quiz'>('view');
  const [patternId, setPatternId] = useState<'a' | 'b' | 'c'>('a');
  const [keyIdx, setKeyIdx] = useState(7); // 默认 G（Pattern A 示例调）
  const [labelMode, setLabelMode] = useState<'degree' | 'note'>('degree');
  const [showFinger, setShowFinger] = useState(false);

  const pattern = AUG_PATTERNS.find((p) => p.id === patternId) ?? AUG_PATTERNS[0];

  // 指形音符：8~16 个覆盖 1–6 弦的位置；必要时整体移入可显示八度
  const notes = useMemo(() => patternRoute(pattern, keyIdx) ?? [], [pattern, keyIdx]);
  const labels = useMemo(() => notes.map(entryName), [notes]);

  const reachKey =
    pattern.reach && notes[pattern.reach.noteIndex]
      ? `${notes[pattern.reach.noteIndex].string}-${notes[pattern.reach.noteIndex].fret}`
      : null;

  function pickPattern(id: 'a' | 'b' | 'c') {
    const p = AUG_PATTERNS.find((x) => x.id === id)!;
    setPatternId(id);
    setKeyIdx(p.baseTonic); // 切指形时跳到该指形的示例调
  }

  const reachEntry = pattern.reach && notes[pattern.reach.noteIndex] ? notes[pattern.reach.noteIndex] : null;
  const reachHint = reachEntry
    ? t('reachHint', {
        string: t('stringX', {n: reachEntry.string}),
        fret: t('fretX', {n: reachEntry.fret}),
      })
    : '';

  const segBtn = (active: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-accent text-[#0a0a0a]'
        : 'border border-line bg-card-2 text-muted hover:text-text'
    }`;

  return (
    <div className="mx-auto max-w-[640px]">
      {/* 模式切换：查看指形 / 找音练习 */}
      <div className="mb-4 flex justify-center gap-2">
        <button onClick={() => setMode('view')} className={segBtn(mode === 'view')}>
          {t('modeView')}
        </button>
        <button onClick={() => setMode('quiz')} className={segBtn(mode === 'quiz')}>
          {t('modeQuiz')}
        </button>
      </div>

      {/* 指形选择（查看与练习共用） */}
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {AUG_PATTERNS.map((p) => {
          const active = p.id === patternId;
          return (
            <button
              key={p.id}
              onClick={() => pickPattern(p.id)}
              className={`rounded-xl px-3 py-2.5 text-left transition ${
                active
                  ? 'bg-accent text-[#0a0a0a]'
                  : 'border border-line bg-card-2 text-muted hover:text-text'
              }`}
            >
              <div className="text-sm font-bold">{t(p.nameKey)}</div>
              <div
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active
                    ? 'bg-[#0a0a0a]/15 text-[#0a0a0a]'
                    : 'bg-[#e8a850]/10 text-accent'
                }`}
              >
                {t(p.tagKey)}
              </div>
            </button>
          );
        })}
      </div>

      {/* 调性选择（查看与练习共用） */}
      <div className="mb-4">
        <div className="mb-1.5 text-sm font-semibold text-muted">{t('key')}</div>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {CHROMATIC_NOTES.map((k, i) => (
            <button
              key={k}
              onClick={() => setKeyIdx(i)}
              className={`min-h-9 rounded-lg text-sm font-semibold transition ${
                i === keyIdx
                  ? 'bg-accent text-[#0a0a0a]'
                  : 'border border-line bg-card-2 text-text hover:bg-card'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {mode === 'quiz' ? (
        <PatternQuiz
          key={`${patternId}-${keyIdx}`}
          pattern={pattern}
          tonic={keyIdx}
          keyName={CHROMATIC_NOTES[keyIdx]}
          patternName={t(pattern.nameKey)}
        />
      ) : (
        <>
          {/* 指形说明 + 伸展提示 */}
          <p className="mb-4 text-center text-sm leading-relaxed text-muted">
            {t(pattern.detailKey)}
            {reachHint && (
              <span className="mt-1 block font-semibold text-accent">{reachHint}</span>
            )}
          </p>

          {/* 指板 */}
          <div className="mb-4 rounded-2xl border border-line bg-card p-4">
            <ScaleFretboard
              notes={notes}
              labels={labels}
              reachKey={reachKey}
              labelMode={labelMode}
              showFinger={showFinger}
            />
            {/* 音级图例 */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <span key={d} className="flex items-center gap-1.5 text-xs text-muted">
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-[#0a0a0a]"
                    style={{backgroundColor: DEGREE_COLORS[d]}}
                  >
                    {d}
                  </span>
                  {d === 1 && <span className="text-[#6b6b6b]">{t('degreeRoot')}</span>}
                </span>
              ))}
            </div>
          </div>

          {/* 显示选项：音级/音名 + 指法 */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex gap-1.5">
              <button onClick={() => setLabelMode('degree')} className={segBtn(labelMode === 'degree')}>
                {t('degree')}
              </button>
              <button onClick={() => setLabelMode('note')} className={segBtn(labelMode === 'note')}>
                {t('noteName')}
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={showFinger}
                onChange={(e) => setShowFinger(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              {t('showFinger')}
            </label>
          </div>
        </>
      )}
    </div>
  );
}