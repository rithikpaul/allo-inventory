"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, AlertCircle, ChevronDown, User, Mail } from "lucide-react";
import { ProductWithStock } from "@/lib/schemas";

interface ReservationFormProps {
  product: ProductWithStock;
}

export function ReservationForm({ product }: ReservationFormProps) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState("");
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableWarehouses = product.stock.filter((s) => s.availableQty > 0);
  const selectedStock = product.stock.find((s) => s.warehouseId === warehouseId);
  const maxQty = selectedStock?.availableQty ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      setError("Please select a warehouse");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Generate idempotency key for safe retries
      const idempotencyKey = `reserve-${product.id}-${warehouseId}-${Date.now()}`;

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          productId: product.id,
          warehouseId,
          qty,
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(
          `Not enough stock available. ${data.error}`
        );
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to create reservation");
        return;
      }

      // Navigate to the reservation detail page
      router.push(`/reservations/${data.id}`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s",
  } as const;

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 6,
    display: "block",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Warehouse selector */}
      <div>
        <label style={labelStyle}>Ship from warehouse</label>
        <div style={{ position: "relative" }}>
          <select
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setQty(1); setError(null); }}
            style={{
              ...inputStyle,
              appearance: "none",
              cursor: "pointer",
              paddingRight: 36,
            }}
            required
          >
            <option value="">Select a warehouse...</option>
            {product.stock.map((s) => (
              <option
                key={s.warehouseId}
                value={s.warehouseId}
                disabled={s.availableQty === 0}
              >
                {s.warehouseName} ({s.warehouseCity}) —{" "}
                {s.availableQty === 0
                  ? "Out of stock"
                  : `${s.availableQty} available`}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Quantity */}
      {warehouseId && maxQty > 0 && (
        <div>
          <label style={labelStyle}>Quantity</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              −
            </button>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 20,
                fontWeight: 500,
                minWidth: 32,
                textAlign: "center",
              }}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              max {maxQty}
            </span>
          </div>
        </div>
      )}

      {/* Customer details */}
      <div>
        <label style={labelStyle}>Your name (optional)</label>
        <div style={{ position: "relative" }}>
          <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe"
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email (optional)</label>
        <div style={{ position: "relative" }}>
          <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="john@example.com"
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--red-dim)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--red)", lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Price summary */}
      {warehouseId && selectedStock && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {qty} × ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>
            ₹{(product.price * qty).toLocaleString("en-IN")}
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !warehouseId || maxQty === 0}
        style={{
          padding: "14px 24px",
          borderRadius: 10,
          background: loading || !warehouseId ? "var(--surface-4)" : "var(--brand)",
          color: loading || !warehouseId ? "var(--text-muted)" : "#fff",
          border: "none",
          fontSize: 15,
          fontWeight: 600,
          cursor: loading || !warehouseId ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.15s",
          letterSpacing: "-0.01em",
        }}
      >
        <ShoppingCart size={16} />
        {loading ? "Reserving..." : "Reserve Now — 10 min hold"}
      </button>

      <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        No payment now. Units are held for 10 minutes while you complete checkout.
      </p>
    </form>
  );
}
