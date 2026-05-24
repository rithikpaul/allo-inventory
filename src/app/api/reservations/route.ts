import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  created,
  conflict,
  badRequest,
  notFound,
  handleUnknownError,
  getExpiryTime,
} from "@/lib/api";
import { CreateReservationSchema, ReservationDetail } from "@/lib/schemas";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  return withIdempotency(idempotencyKey, async () => {
    try {
      const body = await req.json();
      const parsed = CreateReservationSchema.safeParse(body);

      if (!parsed.success) {
        return badRequest("Validation failed", parsed.error.flatten().fieldErrors);
      }

      const { productId, warehouseId, qty, customerName, customerEmail } =
        parsed.data;

      // ──────────────────────────────────────────────────────────────────────
      // CONCURRENCY-SAFE RESERVATION
      //
      // We use a Postgres transaction with SELECT ... FOR UPDATE to acquire
      // a row-level lock on the stock record. This means:
      //
      //   1. Two simultaneous requests for the same SKU/warehouse will be
      //      serialized — the second waits until the first commits or rolls back.
      //   2. After the lock is acquired, we re-check available stock. If the
      //      first request consumed the last unit, the second sees qty=0 and
      //      returns 409 — exactly one succeeds.
      //
      // This is the correct solution. Alternatives:
      //   - Optimistic locking (version column): requires retry logic.
      //   - Redis SETNX: distributed lock, more moving parts, no extra benefit
      //     when Postgres is already the source of truth.
      // ──────────────────────────────────────────────────────────────────────

      const result = await prisma.$transaction(async (tx) => {
        // Lock the specific stock row for this product+warehouse combination
        const stockRows = await tx.$queryRaw<
          Array<{
            id: string;
            totalQty: number;
            reservedQty: number;
          }>
        >`
          SELECT id, "totalQty", "reservedQty"
          FROM stock
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;

        if (stockRows.length === 0) {
          return { type: "NOT_FOUND" as const };
        }

        const stock = stockRows[0];
        const availableQty = stock.totalQty - stock.reservedQty;

        if (availableQty < qty) {
          return {
            type: "INSUFFICIENT" as const,
            available: availableQty,
            requested: qty,
          };
        }

        // Increment reserved qty
        await tx.stock.update({
          where: {
            productId_warehouseId: { productId, warehouseId },
          },
          data: { reservedQty: { increment: qty } },
        });

        // Create the reservation record
        const reservation = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            qty,
            status: "PENDING",
            expiresAt: getExpiryTime(),
            customerName,
            customerEmail,
          },
          include: {
            product: true,
            warehouse: true,
          },
        });

        return { type: "SUCCESS" as const, reservation };
      });

      // Handle transaction outcomes
      if (result.type === "NOT_FOUND") {
        return notFound("No stock record found for this product/warehouse combination");
      }

      if (result.type === "INSUFFICIENT") {
        return conflict(
          `Insufficient stock. Requested: ${result.requested}, Available: ${result.available}`
        );
      }

      const { reservation } = result;
      const now = new Date();
      const secondsRemaining = Math.max(
        0,
        Math.floor((reservation.expiresAt.getTime() - now.getTime()) / 1000)
      );

      const response: ReservationDetail = {
        id: reservation.id,
        productId: reservation.productId,
        productName: reservation.product.name,
        productSku: reservation.product.sku,
        productPrice: reservation.product.price,
        warehouseId: reservation.warehouseId,
        warehouseName: reservation.warehouse.name,
        warehouseCity: reservation.warehouse.city,
        qty: reservation.qty,
        status: reservation.status,
        expiresAt: reservation.expiresAt.toISOString(),
        confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
        releasedAt: reservation.releasedAt?.toISOString() ?? null,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        createdAt: reservation.createdAt.toISOString(),
        totalPrice: reservation.product.price * reservation.qty,
        secondsRemaining,
      };

      return created(response);
    } catch (error) {
      return handleUnknownError(error);
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const reservations = await prisma.reservation.findMany({
      where: status ? { status: status as any } : undefined,
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const now = new Date();
    const result = reservations.map((r) => ({
      id: r.id,
      productName: r.product.name,
      warehouseName: r.warehouse.name,
      qty: r.qty,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      secondsRemaining: Math.max(
        0,
        Math.floor((r.expiresAt.getTime() - now.getTime()) / 1000)
      ),
      createdAt: r.createdAt.toISOString(),
    }));

    return ok({ reservations: result, total: result.length });
  } catch (error) {
    return handleUnknownError(error);
  }
}
