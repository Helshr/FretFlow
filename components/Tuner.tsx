'use client';

import {useTranslations} from 'next-intl';
import {track} from '@vercel/analytics';
import {Link} from '@/i18n/navigation';
import {GUITAR_STRINGS} from '@/lib/guitar';
import {useTuner} from '@/hooks/useTuner';
import {saveReferencePitch} from '@/lib/prefs';

export default function Tuner() {
  const t = useTranslations('tuner');
  const {running, detected, silent, micError, tunedCount, allTuned, reference, setReference, start, stop} =
    useTuner();

  const cents = detected ? detected.stringCents : 0;
  const inTune = detected !== null && Math.abs(cents) <= 5;
  const needlePct = Math.max(0, Math.min(100, ((cents + 50) / 100) * 100));

  const statusText = micError
    ? t('micError')
    : silent
      ? t('pluck')
      : detected
        ? inTune
          ? t('inTune')
          : cents < 0
            ? t('flat')
            : t('sharp')
        : t('listening');

  return (
    <div className="mx-auto max-w-[560px] text-center">
      {/* 参考音高切换（440 / 432 Hz） */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {t('referencePitch')}
        </span>
        <div className="flex gap-0.5 rounded-full border border-line bg-card-2 p-[3px]">
          {[440, 432].map((hz) => (
            <button
              key={hz}
              onClick={() => {
                setReference(hz);
                saveReferencePitch(hz);
              }}
              className={`rounded-full px-4 py-1 text-sm font-bold font-[inherit] cursor-pointer transition-all ${
                reference === hz
                  ? 'bg-accent text-[#0a0a0a] [box-shadow:0_2px_12px_rgba(232,168,80,0.3)]'
                  : 'text-muted hover:text-text'
              }`}
            >
              {hz} Hz
            </button>
          ))}
        </div>
      </div>

      {/* 弦排 */}
      <div className="mb-8 flex justify-center gap-2">
        {GUITAR_STRINGS.map((s) => {
          const active = detected?.string === s.string;
          return (
            <div
              key={s.string}
              className={`flex h-16 w-14 flex-col items-center justify-center rounded-xl border transition ${
                active
                  ? inTune
                    ? 'border-accent-2 bg-accent-2/15 text-accent-2'
                    : 'border-accent bg-accent/15 text-accent'
                  : 'border-line bg-card text-muted'
              }`}
            >
              <span className="text-2xl font-bold">{s.note}</span>
              <span className="text-xs">{t('stringX', {n: s.string})}</span>
            </div>
          );
        })}
      </div>

      {/* 检测显示 */}
      <div className="rounded-2xl border border-line bg-card p-8">
        <div
          className={`text-[5rem] font-extrabold leading-none ${
            inTune ? 'text-accent-2' : detected ? 'text-text' : 'text-muted/30'
          }`}
        >
          {detected ? detected.stringNote : ''}
        </div>
        <div className="mt-3 min-h-6 text-base text-muted">{statusText}</div>

        {/* 音分指示条 */}
        <div className="relative mx-auto mt-8 h-2 w-full max-w-[360px] rounded-full bg-card-2">
          <div className="absolute left-1/2 top-[-4px] h-4 w-0.5 -translate-x-1/2 bg-line" />
          {detected && (
            <div
              className="absolute top-[-7px] h-5 w-1.5 -translate-x-1/2 rounded-full bg-accent"
              style={{left: `${needlePct}%`}}
            />
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>-50</span>
          <span>0</span>
          <span>+50</span>
        </div>
      </div>

      {/* 控制 */}
      <div className="mt-6">
        {!running ? (
          <button
            onClick={() => {
              track('tuner_started');
              start();
            }}
            className="min-h-12 rounded-xl bg-accent px-10 py-3 text-base font-semibold text-[#0a0a0a] hover:brightness-110"
          >
            {t('start')}
          </button>
        ) : (
          <button
            onClick={stop}
            className="min-h-12 rounded-xl border border-line bg-card-2 px-10 py-3 text-base font-semibold hover:brightness-110"
          >
            {t('stop')}
          </button>
        )}
      </div>

      {/* 调音后转化入口 */}
      <div className="mt-8 rounded-2xl border border-line bg-card p-6 text-center">
        {allTuned ? (
          <>
            <div className="text-lg font-bold text-accent-2">{t('ctaCompleted')}</div>
            <Link
              href="/trainer"
              onClick={() => track('tuner_to_trainer_clicked', {stage: 'completed'})}
              className="mt-4 inline-block min-h-12 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-[#0a0a0a] hover:brightness-110"
            >
              {t('ctaTrainer')}
            </Link>
          </>
        ) : (
          <>
            <div className="text-lg font-bold">{t('ctaTitle')}</div>
            <p className="mt-1 text-sm text-muted">{t('ctaTrainer')}</p>
            <p className="mt-1 text-xs text-muted">
              {t('tunedProgress', {n: tunedCount, total: GUITAR_STRINGS.length})}
            </p>
            <Link
              href="/trainer"
              onClick={() => track('tuner_to_trainer_clicked', {stage: 'default'})}
              className="mt-4 inline-block min-h-12 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-[#0a0a0a] hover:brightness-110"
            >
              {t('ctaStart')}
            </Link>
          </>
        )}
        <p className="mt-3">
          <Link
            href="/notes"
            onClick={() => track('tuner_to_trainer_clicked', {stage: 'notes'})}
            className="text-sm text-muted underline decoration-muted/40 underline-offset-4 hover:text-text"
          >
            {t('ctaNotes')}
          </Link>
        </p>
      </div>
    </div>
  );
}