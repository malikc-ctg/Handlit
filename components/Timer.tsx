// components/Timer.tsx
// Count-up timer. Survives app backgrounding via AppState + timestamps.

import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Colors, FontSize, FontWeight } from '../lib/theme';

interface Props {
  running: boolean;
  onTick?: (seconds: number) => void;
  style?: object;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Timer({ running, onTick, style }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (nextState === 'active') {
        if (backgroundedAt.current && running) {
          const secondsInBackground = Math.floor((Date.now() - backgroundedAt.current) / 1000);
          const newElapsed = elapsedRef.current + secondsInBackground;
          setElapsed(newElapsed);
          elapsedRef.current = newElapsed;
          onTick?.(newElapsed);
          backgroundedAt.current = null;
          startInterval();
        }
      }
    });
    return () => sub.remove();
  }, [running]);

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      onTick?.(elapsedRef.current);
    }, 1000);
  }

  useEffect(() => {
    if (running) {
      startInterval();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  return (
    <Text style={[styles.timer, style]}>
      {formatTime(elapsed)}
    </Text>
  );
}

export { formatTime };

const styles = StyleSheet.create({
  timer: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
});
