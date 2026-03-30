"use client";

import { useRef, useCallback, useState } from "react";

interface SwipeState {
  offsetX: number;
  swiping: boolean;
  direction: "left" | "right" | null;
}

interface UseSwipeOptions {
  threshold?: number;
  maxSwipe?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipe({
  threshold = 60,
  maxSwipe = 100,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeOptions = {}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    swiping: false,
    direction: null,
  });

  const reset = useCallback(() => {
    setState({ offsetX: 0, swiping: false, direction: null });
    locked.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      // Lock to horizontal after first significant move
      if (!locked.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        locked.current = true;
        return;
      }
      if (locked.current) return;

      if (Math.abs(dx) > 10) {
        e.preventDefault();
      }

      const clamped = Math.max(-maxSwipe, Math.min(maxSwipe, dx));
      setState({
        offsetX: clamped,
        swiping: true,
        direction: clamped > 0 ? "right" : clamped < 0 ? "left" : null,
      });
    },
    [maxSwipe],
  );

  const onTouchEnd = useCallback(() => {
    if (state.offsetX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (state.offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    reset();
  }, [state.offsetX, threshold, onSwipeLeft, onSwipeRight, reset]);

  return {
    ...state,
    reset,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
