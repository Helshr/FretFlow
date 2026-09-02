'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {completeToneAuthorization} from '@/lib/tone3000';

export default function ToneCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('正在完成 Tone3000 授权…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      setMessage(params.get('error') || '授权未完成');
      return;
    }
    completeToneAuthorization(code, state)
      .then(() => {
        const toneId = params.get('tone_id');
        if (toneId) sessionStorage.setItem('t3k_tone_id', toneId);
        router.replace('/tone');
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : '授权失败'));
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-8 text-[#f5f5f5]"><p>{message}</p></main>;
}
