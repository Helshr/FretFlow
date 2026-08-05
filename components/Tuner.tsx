'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {autoCorrelate, freqToDetected, GUITAR_STRINGS} from '@/lib/tuner/pitch';
import type {Detected} from '@/lib/tuner/pitch';

export default function Tuner() {
  const t = useTranslations('tuner');
  const [running, setRunning] = useState(false);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [silent, setSilent] = useState(false);
  const [micError, setMicError] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const loop = useCallback(function tick() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    if (!bufRef.current) bufRef.current = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(bufRef.current);
    const sampleRate = ctxRef.current?.sampleRate ?? 44100;
    const freq = autoCorrelate(bufRef.current, sampleRate);
    if (freq > 0) {
      setSilent(false);
      setDetected(freqToDetected(freq));
    } else {
      setSilent(true);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (running) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      streamRef.current = stream;
      const AC =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      src.connect(analyser);
      analyserRef.current = analyser;
      setRunning(true);
      setMicError(false);
      setDetected(null);
      setSilent(false);
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMicError(true);
      setRunning(false);
    }
  }, [running, loop]);

  const stop = useCallback(() => {
    setRunning(false);
    setDetected(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

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
            onClick={start}
            className="min-h-12 rounded-xl bg-accent px-10 py-3 text-base font-semibold text-white hover:brightness-110"
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
    </div>
  );
}
