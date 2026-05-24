import { Navbar } from "@/components/Navbar";
import { MapPin, Package, BarChart3, Layers } from "lucide-react";

async function getWarehouses() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/warehouses`, { cache: "no-store" });
  if (!res.ok) return { warehouses: [] };
  return res.json();
}

export default async function WarehousesPage() {
  const { warehouses } = await getWarehouses();

  const totalUnits = warehouses.reduce((s: number, w: any) => s + w.totalUnits, 0);
  const totalReserved = warehouses.reduce((s: number, w: any) => s + w.reservedUnits, 0);

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
            Warehouse Network
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            {warehouses.length} fulfillment centers across India.
          </p>
        </div>

        {/* Network stats */}
        <div
          className="animate-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { label: "Warehouses", value: warehouses.length, icon: MapPin },
            { label: "Total Units", value: totalUnits.toLocaleString(), icon: Package },
            { label: "Reserved Units", value: totalReserved.toLocaleString(), icon: Layers },
            { label: "Available Units", value: (totalUnits - totalReserved).toLocaleString(), icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon size={14} color="var(--brand)" />
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Warehouse cards */}
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {warehouses.map((w: any) => {
            const utilizationPct = w.totalUnits > 0
              ? Math.round((w.reservedUnits / w.totalUnits) * 100)
              : 0;

            return (
              <div key={w.id} className="card card-hover animate-fade-in" style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>
                      {w.name}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                      <MapPin size={11} />
                      {w.location}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "var(--surface-3)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--brand)",
                    }}
                  >
                    {w.city}
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Products", value: w.totalProducts },
                    { label: "Total Units", value: w.totalUnits },
                    { label: "Available", value: w.availableUnits, color: "var(--green)" },
                    { label: "Reserved", value: w.reservedUnits, color: "var(--brand)" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{
                        padding: "10px 12px",
                        background: "var(--surface-2)",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? "var(--text-primary)", fontFamily: "Syne, sans-serif" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Utilization bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reservation utilization</span>
                    <span className="font-mono" style={{ fontSize: 11, color: utilizationPct > 70 ? "var(--amber)" : "var(--text-muted)" }}>
                      {utilizationPct}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: "var(--surface-4)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${utilizationPct}%`,
                        background: utilizationPct > 70 ? "var(--amber)" : "var(--brand)",
                        borderRadius: 3,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Active reservations */}
                {w.activeReservations > 0 && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--brand-glow)", borderRadius: 6, border: "1px solid rgba(249,115,22,0.2)", fontSize: 12, color: "var(--brand)" }}>
                    ⚡ {w.activeReservations} active reservation{w.activeReservations !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
