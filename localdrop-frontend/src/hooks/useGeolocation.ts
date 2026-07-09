"use client";

import { useCallback, useState } from "react";
import { getStoredLanguage, translate } from "@/i18n/config";

type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  const fetchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: translate(getStoredLanguage(), "validation.noGeolocationSupport") }));
      return Promise.reject(new Error("Geolocation not supported"));
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            loading: false,
            error: null,
          });
          resolve(position);
        },
        async (err) => {
          // Attempt IP location fallback
          try {
            const res = await fetch("https://ipapi.co/json/");
            if (!res.ok) throw new Error("IP Geolocation failed");
            const data = await res.json();
            if (data.latitude && data.longitude) {
              const position = {
                coords: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  accuracy: 10000,
                },
                timestamp: Date.now(),
              } as GeolocationPosition;
              
              setState({
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 10000,
                loading: false,
                error: null,
              });
              resolve(position);
              return;
            }
          } catch {
            // Secondary fallback using ip-api.com
            try {
              const res = await fetch("https://ipapi.co/json/"); // Fallback to same or try ip-api
              // Since ip-api.com has a secure endpoint but requires pro, we stick to ipapi.co
            } catch {}
          }

          const message = err.code === 1
            ? translate(getStoredLanguage(), "validation.locationDenied")
            : err.code === 2
            ? translate(getStoredLanguage(), "validation.locationUnavailable")
            : translate(getStoredLanguage(), "validation.locationTimedOut");
          setState((s) => ({ ...s, loading: false, error: message }));
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  return { ...state, fetchPosition };
}
