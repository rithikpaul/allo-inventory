"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;
  const isDanger = secondsLeft <= 30;
  const isExpired = secondsLeft === 0;

  const color = isExpired
    ? "var(--red)"
    : isDanger
    ? "var(--red)"
    : isUrgent
    ? "var(--amber)"
    : "var(--text-primary)";

  const bgColor = isExpired
    ? "var(--red-dim)"
    : isDanger
    ? "var(--red-dim)"
    : isUrgent
    ? "var(--amber-dim)"
    : "var(--surface-3)";

  // Progress bar percentage
  const totalSeconds = Math.floor(
    (new Date(expiresAt).getTime() - (Date.now() - (600 - secondsLeft) * 1000)) / 1000 + secondsLeft
  );
  const progress = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        background: bgColor,
        border: `1px solid ${color}33`,
        transition: "all 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isDanger || isExpired ? (
            <AlertTriangle size={16} color={color} />
          ) : (
            <Clock size={16} color={color} />
          )}
          <span style={{ fontSize: 13, fontWeight: 500, color }}>
            {isExpired ? "Reservation expired" : "Time remaining"}
          </span>
        </div>

        <div
          className={!isExpired && isUrgent ? "animate-countdown" : ""}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 24,
            fontWeight: 500,
            color,
            letterSpacing: "-0.02em",
          }}
        >
          {isExpired ? (
            "00:00"
          ) : (
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: color,
            borderRadius: 999,
            transition: "width 1s linear, background 0.3s",
          }}
        />
      </div>

      {!isExpired && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
          {isDanger
            ? "⚡ Act fast — your hold is about to expire"
            : isUrgent
            ? "Your reservation is almost up"
            : "Units are held exclusively for you"}
        </p>
      )}
    </div>
  );
}
