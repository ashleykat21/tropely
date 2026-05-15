import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useAppStatePolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const start = () => {
      savedCallback.current();
      intervalRef.current = setInterval(() => savedCallback.current(), intervalMs);
    };

    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    start();

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        stop();
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [intervalMs]);
}
