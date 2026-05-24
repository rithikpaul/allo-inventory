import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allo Inventory — Multi-Warehouse Fulfillment",
  description:
    "Real-time inventory reservation system for multi-warehouse retail and D2C brands.",
  keywords: ["inventory", "warehouse", "fulfillment", "reservations", "ecommerce"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise min-h-screen">
        {children}
      </body>
    </html>
  );
}
