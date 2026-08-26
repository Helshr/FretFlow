'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {autoCorrelate, freqToDetected} from '@/lib/tuner/pitch';
import type {Detected} from '@/lib/tuner/pitch';

export function useTuner() {
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

  return {running, detected, silent, micError, start, stop};
}
