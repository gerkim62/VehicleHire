import { useState, useEffect, useRef } from "react";

export function useTimer(startedAt: number | null) {
  const [prevStartedAt, setPrevStartedAt] = useState(startedAt);
  const [elapsed, setElapsed] = useState(0);

  if (startedAt !== prevStartedAt) {
    setPrevStartedAt(startedAt);
    setElapsed(0);
  }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) return;

    const update = () => {
      setElapsed(Date.now() - startedAt);
    };

    update(); // Sync immediately on effect trigger

    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  return elapsed;
}
