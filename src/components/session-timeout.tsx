"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 min before logout

export function SessionTimeout() {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    if (!user) return;

    // Warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetTimers();

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-warning/10 border border-warning rounded-xl p-4 shadow-lg max-w-sm">
      <p className="text-sm font-medium text-navy">Session Expiring</p>
      <p className="text-xs text-muted mt-1">
        You will be logged out in 2 minutes due to inactivity.
      </p>
      <button
        onClick={resetTimers}
        className="mt-2 px-4 py-1.5 bg-teal hover:bg-teal-dark text-white text-xs font-medium rounded-lg transition-colors"
      >
        Stay Logged In
      </button>
    </div>
  );
}
