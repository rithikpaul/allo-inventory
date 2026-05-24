import { z } from "zod";

// ─── Reservation ────────────────────────────────────────────────────────────

export const CreateReservationSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  warehouseId: z.string().cuid("Invalid warehouse ID"),
  qty: z.number().int().min(1, "Quantity must be at least 1").max(100),
  customerName: z.string().min(2, "Name must be at least 2 characters").optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const ConfirmReservationSchema = z.object({
  id: z.string().cuid("Invalid reservation ID"),
});

// ─── Query params ────────────────────────────────────────────────────────────

export const ProductListQuerySchema = z.object({
  category: z.string().optional(),
  warehouseId: z.string().optional(),
  inStockOnly: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// ─── API Response types ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  description: string;
  imageUrl: string | null;
  category: string;
  price: number;
  stock: {
    warehouseId: string;
    warehouseName: string;
    warehouseCity: string;
    totalQty: number;
    reservedQty: number;
    availableQty: number;
  }[];
  totalAvailable: number;
}

export interface WarehouseWithStats {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  totalProducts: number;
  totalUnits: number;
  reservedUnits: number;
}

export interface ReservationDetail {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  warehouseId: string;
  warehouseName: string;
  warehouseCity: string;
  qty: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  totalPrice: number;
  secondsRemaining: number;
}
