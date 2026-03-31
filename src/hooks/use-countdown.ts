"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      clear();
      setSecondsLeft(seconds ?? initialSeconds);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds, clear],
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start,
  };
}
