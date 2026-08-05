'use client';

import {useRef} from 'react';
import {drumMachine} from '@/lib/drum/drumMachine';

export function useDrumMachine() {
  const drumRef = useRef(drumMachine);

  return {
    start: (bpm: number, onBar: () => void, patternId?: string) =>
      drumRef.current.start(bpm, onBar, patternId),
    stop: () => drumRef.current.stop(),
  };
}
