"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { ReservationDetail } from "@/lib/schemas";
import { CountdownTimer } from "./CountdownTimer";

interface ReservationActionsProps {
  reservation: ReservationDetail;
}

export function ReservationActions({ reservation }: ReservationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"confirm" | "release" | null>(null);
  const [error, setError] = useState<{ code: number; message: string } | null>(null);
  const [expired, setExpired] = useState(
    reservation.status !== "PENDING" || reservation.secondsRemaining <= 0
  );

  const isPending = reservation.status === "PENDING" && !expired;

  const handleConfirm = async () => {
    setLoading("confirm");
    setError(null);

    try {
      const idempotencyKey = `confirm-${reservation.id}-${Date.now()}`;
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
      });

      const data = await res.json();

      if (res.status === 410) {
        setError({ code: 410, message: data.error });
        setExpired(true);
        return;
      }

      if (res.status === 409) {
        setError({ code: 409, message: data.error });
        return;
      }

      if (!res.ok) {
        setError({ code: res.status, message: data.error ?? "Something went wrong" });
        return;
      }

      // Refresh the page to show confirmed state
      router.refresh();
    } catch {
      setError({ code: 0, message: "Network error — please try again" });
    } finally {
      setLoading(null);
    }
  };

  const handleRelease = async () => {
    if (!confirm("Cancel this reservation? The units will be released back to stock.")) return;

    setLoading("release");
    setError(null);

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ code: res.status, message: data.error ?? "Failed to release reservation" });
        return;
      }

      router.refresh();
    } catch {
      setError({ code: 0, message: "Network error — please try again" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Countdown — only show for pending */}
      {reservation.status === "PENDING" && (
        <CountdownTimer
          expiresAt={reservation.expiresAt}
          onExpire={() => setExpired(true)}
        />
      )}

      {/* Status for non-pending */}
      {reservation.status === "CONFIRMED" && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--green-dim)",
            border: "1px solid rgba(34,197,94,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckCircle size={20} color="var(--green)" />
          <div>
            <div style={{ fontWeight: 600, color: "var(--green)" }}>Order Confirmed</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Your purchase was successful. Thank you!
            </div>
          </div>
        </div>
      )}

      {reservation.status === "RELEASED" && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <XCircle size={20} color="var(--red)" />
          <div>
            <div style={{ fontWeight: 600, color: "var(--red)" }}>Reservation Released</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Units have been returned to available stock.
            </div>
          </div>
        </div>
      )}

      {/* Expired message */}
      {expired && reservation.status === "PENDING" && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AlertCircle size={20} color="var(--red)" />
          <div>
            <div style={{ fontWeight: 600, color: "var(--red)" }}>Reservation Expired</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Your 10-minute hold has ended. Go back and reserve again.
            </div>
          </div>
        </div>
      )}

      {/* API errors */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            gap: 10,
          }}
        >
          <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 6 }}>
              {error.code === 410 ? "HTTP 410 Gone" : error.code === 409 ? "HTTP 409 Conflict" : `HTTP ${error.code}`}
            </span>
            <span style={{ fontSize: 13, color: "var(--red)" }}>{error.message}</span>
          </div>
        </div>
      )}

      {/* Action buttons — only for pending, non-expired */}
      {isPending && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleConfirm}
            disabled={!!loading}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 10,
              background: loading === "confirm" ? "var(--surface-4)" : "var(--brand)",
              color: loading === "confirm" ? "var(--text-muted)" : "#fff",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {loading === "confirm" ? (
              <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Processing...</>
            ) : (
              <><CheckCircle size={15} /> Confirm Purchase</>
            )}
          </button>

          <button
            onClick={handleRelease}
            disabled={!!loading}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: "var(--surface-3)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {loading === "release" ? (
              <Loader size={15} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <XCircle size={15} />
            )}
            Cancel
          </button>
        </div>
      )}

      {/* Back to products */}
      {(reservation.status !== "PENDING" || expired) && (
        <a
          href="/"
          style={{
            display: "block",
            padding: "14px 20px",
            borderRadius: 10,
            background: "var(--surface-3)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          ← Back to Products
        </a>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
