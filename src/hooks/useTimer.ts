import { useState, useEffect, useRef } from "react";

export function useTimer(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const update = () => {
      setElapsed(Date.now() - startedAt);
    };

    update(); // Set initial value
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt]);

  return elapsed;
}
