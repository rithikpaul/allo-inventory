import { Navbar } from "@/components/Navbar";
import { ClipboardList, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

async function getReservations() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/reservations?limit=50`, {
    cache: "no-store",
  });
  if (!res.ok) return { reservations: [], total: 0 };
  return res.json();
}

export default async function ReservationsPage() {
  const { reservations, total } = await getReservations();

  const pending = reservations.filter((r: any) => r.status === "PENDING");
  const confirmed = reservations.filter((r: any) => r.status === "CONFIRMED");
  const released = reservations.filter((r: any) => r.status === "RELEASED");

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div className="animate-fade-in" style={{ marginBottom: 40 }}>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              marginBottom: 8,
            }}
          >
            Reservations
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Live view of all reservation activity across warehouses.
          </p>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { label: "Total", value: total, icon: ClipboardList, color: "var(--text-primary)" },
            { label: "Pending", value: pending.length, icon: Clock, color: "var(--brand)" },
            { label: "Confirmed", value: confirmed.length, icon: CheckCircle, color: "var(--green)" },
            { label: "Released", value: released.length, icon: XCircle, color: "var(--text-muted)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "Syne, sans-serif" }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card animate-fade-in" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Recent Reservations
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Showing {Math.min(reservations.length, 50)} of {total}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <ClipboardList size={36} style={{ margin: "0 auto 12px" }} />
              <p>No reservations yet. Go reserve a product!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["ID", "Product", "Warehouse", "Qty", "Status", "Expires", "Created"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r: any, i: number) => {
                    const statusColor =
                      r.status === "CONFIRMED"
                        ? "var(--green)"
                        : r.status === "RELEASED"
                        ? "var(--text-muted)"
                        : "var(--brand)";

                    const isExpiredPending =
                      r.status === "PENDING" && r.secondsRemaining <= 0;

                    return (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                          transition: "background 0.15s",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <Link
                            href={`/reservations/${r.id}`}
                            className="font-mono"
                            style={{ fontSize: 12, color: "var(--brand)", textDecoration: "none" }}
                          >
                            #{r.id.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, maxWidth: 200 }}>
                          <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {r.productName}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                          {r.warehouseName}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="font-mono" style={{ fontSize: 13 }}>{r.qty}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            className="badge"
                            style={{
                              background: `${statusColor}18`,
                              color: isExpiredPending ? "var(--red)" : statusColor,
                              border: `1px solid ${isExpiredPending ? "var(--red)" : statusColor}33`,
                            }}
                          >
                            {isExpiredPending ? "EXPIRED" : r.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: isExpiredPending ? "var(--red)" : "var(--text-muted)" }}>
                          {r.status === "PENDING"
                            ? r.secondsRemaining > 0
                              ? `${Math.floor(r.secondsRemaining / 60)}m ${r.secondsRemaining % 60}s`
                              : "Expired"
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
