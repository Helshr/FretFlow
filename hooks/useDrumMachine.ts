'use client';

import {useRef} from 'react';
import {drumMachine} from '@/lib/drum/drumMachine';

export function useDrumMachine() {
  const drumRef = useRef(drumMachine);

  return {
    start: (bpm: number, onBar: () => void, patternId?: string, metronome?: boolean) =>
      drumRef.current.start(bpm, onBar, patternId, metronome),
    stop: () => drumRef.current.stop(),
  };
}
