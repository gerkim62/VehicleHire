import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const UPDATE_INTERVAL = 30000; // 30 seconds

export function useGeolocation(sessionId: Id<"sessions"> | null) {
  const updateLocation = useMutation(api.sessions.updateLocation);
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosition = useRef<GeolocationPosition | null>(null);

  const sendUpdate = useCallback(async () => {
    if (!sessionId || !lastPosition.current) return;

    try {
      await updateLocation({
        sessionId,
        latitude: lastPosition.current.coords.latitude,
        longitude: lastPosition.current.coords.longitude,
        accuracy: lastPosition.current.coords.accuracy,
      });
    } catch (error) {
      console.error("Failed to send location update:", error);
    }
  }, [sessionId, updateLocation]);

  useEffect(() => {
    if (!sessionId || !navigator.geolocation) return;

    // Watch position continuously
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        lastPosition.current = position;
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    // Send updates at interval
    sendUpdate(); // Send first update immediately
    intervalRef.current = setInterval(sendUpdate, UPDATE_INTERVAL);

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, sendUpdate]);
}
