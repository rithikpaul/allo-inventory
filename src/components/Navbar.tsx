"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Warehouse, ClipboardList, Zap } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Products", icon: Package },
    { href: "/warehouses", label: "Warehouses", icon: Warehouse },
    { href: "/reservations", label: "Reservations", icon: ClipboardList },
  ];

  return (
    <nav
      style={{
        background: "rgba(9,9,11,0.85)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--brand)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="font-display"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            allo
            <span style={{ color: "var(--brand)" }}>.</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 4 }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "var(--surface-3)" : "transparent",
                  border: `1px solid ${active ? "var(--border-bright)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 8px var(--green)",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Live</span>
        </div>
      </div>
    </nav>
  );
}
