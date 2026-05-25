import { Navbar } from "@/components/Navbar";
import { StockBadge } from "@/components/StockBadge";
import { ProductWithStock } from "@/lib/schemas";
import { Package2, TrendingDown, Layers } from "lucide-react";
import Link from "next/link";

async function getProducts(): Promise<{ products: ProductWithStock[]; meta: any }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "var(--text-primary)", fontFamily: "Syne, sans-serif" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default async function ProductsPage() {
  const { products, meta } = await getProducts();

  const categories = Array.from(
  new Set(products.map((p) => p.category))
);
  const totalAvailable = products.reduce((s, p) => s + p.totalAvailable, 0);
  const lowStockProducts = products.filter((p) => p.totalAvailable > 0 && p.totalAvailable <= 5);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span className="badge" style={{ background: "var(--brand-glow)", color: "var(--brand)", border: "1px solid rgba(249,115,22,0.2)" }}>
              Live inventory
            </span>
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginBottom: 16,
            }}
          >
            Multi-Warehouse
            <br />
            <span style={{ color: "var(--brand)" }}>Inventory</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.7 }}>
            Real-time stock reservation across warehouses. Units are held for 10 minutes during checkout — never oversell again.
          </p>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <StatCard label="Total Products" value={products.length} />
          <StatCard label="In Stock" value={meta.inStock} sub={`of ${meta.total} products`} color="var(--green)" />
          <StatCard label="Available Units" value={totalAvailable.toLocaleString()} />
          <StatCard label="Low Stock" value={lowStockProducts.length} sub="≤ 5 units" color={lowStockProducts.length > 0 ? "var(--amber)" : "var(--text-primary)"} />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {["All", ...categories].map((cat) => (
            <span
              key={cat}
              className="badge"
              style={{
                background: "var(--surface-3)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Product grid */}
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <Package2 size={40} style={{ margin: "0 auto 16px" }} />
            <p>No products found. Run the seed script to add sample data.</p>
          </div>
        )}
      </main>
    </>
  );
}

function ProductCard({ product }: { product: ProductWithStock }) {
  const isOut = product.totalAvailable === 0;
  const stockByWarehouse = product.stock.filter((s) => s.totalQty > 0);

  return (
    <Link
      href={`/products/${product.id}`}
      style={{ textDecoration: "none" }}
      className="animate-fade-in"
    >
      <div
        className="card card-hover"
        style={{
          padding: 24,
          opacity: isOut ? 0.6 : 1,
          cursor: "pointer",
          height: "100%",
        }}
      >
        {/* Category + SKU */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span
            className="badge"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {product.category}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {product.sku}
          </span>
        </div>

        {/* Name + description */}
        <h2
          className="font-display"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 20,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.description}
        </p>

        {/* Warehouse stock breakdown */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={10} />
            Stock per warehouse
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stockByWarehouse.slice(0, 3).map((s) => (
              <div
                key={s.warehouseId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  background: "var(--surface-2)",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {s.warehouseCity}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Stock bar */}
                  <div style={{ width: 50, height: 3, background: "var(--surface-4)", borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${s.totalQty > 0 ? (s.availableQty / s.totalQty) * 100 : 0}%`,
                        background: s.availableQty === 0 ? "var(--red)" : s.availableQty <= 3 ? "var(--amber)" : "var(--green)",
                        borderRadius: 2,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: s.availableQty === 0 ? "var(--red)" : s.availableQty <= 3 ? "var(--amber)" : "var(--green)",
                      minWidth: 20,
                      textAlign: "right",
                    }}
                  >
                    {s.availableQty}
                  </span>
                </div>
              </div>
            ))}
            {stockByWarehouse.length > 3 && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "0 4px" }}>
                +{stockByWarehouse.length - 3} more warehouses
              </span>
            )}
          </div>
        </div>

        {/* Price + Stock status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </div>
          </div>
          <StockBadge
            available={product.totalAvailable}
            total={product.stock.reduce((s, st) => s + st.totalQty, 0)}
            reserved={product.stock.reduce((s, st) => s + st.reservedQty, 0)}
          />
        </div>

        {/* Reserve CTA */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: isOut ? "var(--surface-3)" : "var(--brand-glow)",
            border: `1px solid ${isOut ? "var(--border)" : "rgba(249,115,22,0.25)"}`,
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            color: isOut ? "var(--text-muted)" : "var(--brand)",
            transition: "all 0.15s",
          }}
        >
          {isOut ? "Out of Stock" : "Reserve → 10 min hold"}
        </div>
      </div>
    </Link>
  );
}
