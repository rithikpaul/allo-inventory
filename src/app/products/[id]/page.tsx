import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ReservationForm } from "@/components/ReservationForm";
import { StockBadge } from "@/components/StockBadge";
import { ProductWithStock } from "@/lib/schemas";
import { ArrowLeft, MapPin, Package, Tag } from "lucide-react";
import Link from "next/link";

async function getProduct(id: string): Promise<ProductWithStock | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
  if (!res.ok) return null;
  const { products } = await res.json();
  return products.find((p: ProductWithStock) => p.id === id) ?? null;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-muted)",
            textDecoration: "none",
            marginBottom: 32,
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft size={14} />
          Back to Products
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* Left — Product details */}
          <div className="animate-fade-in">
            {/* Category + SKU */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <span
                className="badge"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  padding: "5px 12px",
                }}
              >
                <Tag size={10} style={{ marginRight: 5 }} />
                {product.category}
              </span>
              <span
                className="badge font-mono"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  padding: "5px 12px",
                }}
              >
                <Package size={10} style={{ marginRight: 5 }} />
                {product.sku}
              </span>
            </div>

            <h1
              className="font-display"
              style={{
                fontSize: "clamp(24px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 16,
                color: "var(--text-primary)",
              }}
            >
              {product.name}
            </h1>

            <p
              style={{
                fontSize: 16,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                marginBottom: 32,
              }}
            >
              {product.description}
            </p>

            {/* Price */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "Syne, sans-serif", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                ₹{product.price.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Inclusive of all taxes
              </div>
            </div>

            {/* Warehouse stock table */}
            <div>
              <h2
                className="font-display"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 16,
                  letterSpacing: "-0.02em",
                }}
              >
                Stock by Warehouse
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {product.stock.map((s) => (
                  <div
                    key={s.warehouseId}
                    className="card"
                    style={{ padding: "16px 20px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                          {s.warehouseName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                          <MapPin size={10} />
                          {s.warehouseCity}
                        </div>
                      </div>
                      <StockBadge
                        available={s.availableQty}
                        total={s.totalQty}
                        reserved={s.reservedQty}
                        showDetails
                      />
                    </div>

                    {/* Stock utilization bar */}
                    {s.totalQty > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ height: 4, background: "var(--surface-4)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ display: "flex", height: "100%" }}>
                            {/* Available */}
                            <div style={{
                              width: `${(s.availableQty / s.totalQty) * 100}%`,
                              background: s.availableQty <= 3 ? "var(--amber)" : "var(--green)",
                              transition: "width 0.4s"
                            }} />
                            {/* Reserved */}
                            <div style={{
                              width: `${(s.reservedQty / s.totalQty) * 100}%`,
                              background: "var(--brand)",
                              opacity: 0.6,
                              transition: "width 0.4s"
                            }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
                          <span><span style={{ color: "var(--green)" }}>■</span> {s.availableQty} available</span>
                          <span><span style={{ color: "var(--brand)", opacity: 0.6 }}>■</span> {s.reservedQty} reserved</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Reservation form */}
          <div
            className="animate-fade-in card"
            style={{
              padding: 28,
              position: "sticky",
              top: 80,
            }}
          >
            <h2
              className="font-display"
              style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}
            >
              Reserve This Item
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
              Units are held for 10 minutes. No payment until you confirm.
            </p>
            <ReservationForm product={product} />
          </div>
        </div>
      </main>
    </>
  );
}
