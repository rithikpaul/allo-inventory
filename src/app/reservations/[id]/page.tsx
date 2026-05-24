import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ReservationActions } from "@/components/ReservationActions";
import { ReservationDetail } from "@/lib/schemas";
import { Package, MapPin, Hash, Clock } from "lucide-react";
import { format } from "date-fns";

async function getReservation(id: string): Promise<ReservationDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/reservations/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

function InfoRow({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span
        className={mono ? "font-mono" : ""}
        style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", textAlign: "right", maxWidth: "60%" }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reservation = await getReservation(params.id);
  if (!reservation) notFound();

  const statusColor =
    reservation.status === "CONFIRMED"
      ? "var(--green)"
      : reservation.status === "RELEASED"
      ? "var(--red)"
      : "var(--brand)";

  const statusBg =
    reservation.status === "CONFIRMED"
      ? "var(--green-dim)"
      : reservation.status === "RELEASED"
      ? "var(--red-dim)"
      : "var(--brand-glow)";

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <span
              className="badge"
              style={{
                background: statusBg,
                color: statusColor,
                border: `1px solid ${statusColor}33`,
                fontSize: 12,
                padding: "5px 14px",
              }}
            >
              {reservation.status}
            </span>
            <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              #{reservation.id.slice(-8).toUpperCase()}
            </span>
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            {reservation.status === "CONFIRMED"
              ? "Order Confirmed!"
              : reservation.status === "RELEASED"
              ? "Reservation Released"
              : "Complete Your Purchase"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            {reservation.status === "PENDING"
              ? "Your items are reserved. Complete payment before the timer runs out."
              : reservation.status === "CONFIRMED"
              ? "Thank you! Your order has been confirmed and is being processed."
              : "This reservation was cancelled. Units are back in stock."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
          {/* Left — Order details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Product */}
            <div className="card animate-fade-in" style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--surface-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Package size={22} color="var(--brand)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4 }}>
                    {reservation.productName}
                  </h2>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span className="font-mono">{reservation.productSku}</span>
                    <span>Qty: {reservation.qty}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Syne, sans-serif", color: "var(--brand)" }}>
                    ₹{reservation.totalPrice.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    ₹{reservation.productPrice.toLocaleString("en-IN")} each
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment details */}
            <div className="card animate-fade-in" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={12} />
                Fulfillment Details
              </h3>
              <InfoRow label="Warehouse" value={reservation.warehouseName} />
              <InfoRow label="Location" value={reservation.warehouseCity} />
              <InfoRow label="Units Reserved" value={reservation.qty} mono />
              {reservation.customerName && (
                <InfoRow label="Customer" value={reservation.customerName} />
              )}
              {reservation.customerEmail && (
                <InfoRow label="Email" value={reservation.customerEmail} />
              )}
            </div>

            {/* Timeline */}
            <div className="card animate-fade-in" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={12} />
                Timeline
              </h3>
              <InfoRow
                label="Reserved at"
                value={format(new Date(reservation.createdAt), "dd MMM yyyy, HH:mm:ss")}
              />
              <InfoRow
                label="Expires at"
                value={format(new Date(reservation.expiresAt), "dd MMM yyyy, HH:mm:ss")}
              />
              {reservation.confirmedAt && (
                <InfoRow
                  label="Confirmed at"
                  value={format(new Date(reservation.confirmedAt), "dd MMM yyyy, HH:mm:ss")}
                />
              )}
              {reservation.releasedAt && (
                <InfoRow
                  label="Released at"
                  value={format(new Date(reservation.releasedAt), "dd MMM yyyy, HH:mm:ss")}
                />
              )}
              <InfoRow label="Reservation ID" value={reservation.id} mono />
            </div>
          </div>

          {/* Right — Actions */}
          <div className="animate-fade-in" style={{ position: "sticky", top: 80 }}>
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 20 }}>
                {reservation.status === "PENDING" ? "Payment" : "Order Summary"}
              </h3>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Subtotal</span>
                <span style={{ fontSize: 13 }}>₹{reservation.totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Shipping</span>
                <span style={{ fontSize: 13, color: "var(--green)" }}>Free</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--brand)", fontFamily: "Syne, sans-serif" }}>
                  ₹{reservation.totalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <ReservationActions reservation={reservation} />
          </div>
        </div>
      </main>
    </>
  );
}
