interface StockBadgeProps {
  available: number;
  total: number;
  reserved: number;
  showDetails?: boolean;
}

export function StockBadge({ available, total, reserved, showDetails = false }: StockBadgeProps) {
  const isOut = available === 0;
  const isLow = available > 0 && available <= 3;
  const isCritical = available > 0 && available <= 1;

  const color = isOut
    ? "var(--red)"
    : isLow
    ? "var(--amber)"
    : "var(--green)";

  const bgColor = isOut
    ? "var(--red-dim)"
    : isLow
    ? "var(--amber-dim)"
    : "var(--green-dim)";

  const label = isOut
    ? "Out of stock"
    : isCritical
    ? "Last unit!"
    : isLow
    ? `Only ${available} left`
    : `${available} available`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        className="badge"
        style={{
          background: bgColor,
          color,
          border: `1px solid ${color}33`,
        }}
      >
        {label}
      </span>
      {showDetails && total > 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {total} total · {reserved} reserved
        </div>
      )}
    </div>
  );
}
