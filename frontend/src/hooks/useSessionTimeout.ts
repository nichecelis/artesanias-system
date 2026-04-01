import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
import { create } from 'zustand';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE_MS = 120 * 1000; // Mostrar advertencia 2 minutos antes

interface SessionWarningState {
  showWarning: boolean;
  setShowWarning: (show: boolean) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
}

export const useSessionWarningStore = create<SessionWarningState>((set) => ({
  showWarning: false,
  setShowWarning: (showWarning) => set({ showWarning }),
  timeLeft: 120,
  setTimeLeft: (timeLeft) => set({ timeLeft }),
}));

export function useSessionTimeout() {
  const { token, logout } = useAuthStore();
  const lastActivity = useRef(Date.now());
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setShowWarning, setTimeLeft } = useSessionWarningStore();

  const resetTimersRef = useRef<() => void>(() => {});

  const resetTimers = useCallback(() => {
    lastActivity.current = Date.now();
    setShowWarning(false);
    setTimeLeft(120);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (!token) return;

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      let seconds = 120;
      setTimeLeft(seconds);
      countdownTimer.current = setInterval(() => {
        seconds -= 1;
        setTimeLeft(seconds);
        if (seconds <= 0 && countdownTimer.current) {
          clearInterval(countdownTimer.current);
        }
      }, 1000);
    }, TIMEOUT_MS - WARNING_BEFORE_MS);

    checkTimer.current = setTimeout(() => {
      logout();
      setShowWarning(false);
    }, TIMEOUT_MS);
  }, [token, logout, setShowWarning, setTimeLeft]);

  resetTimersRef.current = resetTimers;

  const extendSession = useCallback(() => {
    if (token) {
      resetTimersRef.current();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (checkTimer.current) clearTimeout(checkTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      resetTimersRef.current();
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (checkTimer.current) clearTimeout(checkTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [token, resetTimers]);

  return { extendSession };
}
