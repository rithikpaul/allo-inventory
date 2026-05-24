import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, gone, conflict, handleUnknownError } from "@/lib/api";
import { withIdempotency } from "@/lib/idempotency";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  return withIdempotency(idempotencyKey, async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Lock the reservation row
        const reservations = await tx.$queryRaw<
          Array<{
            id: string;
            status: string;
            expiresAt: Date;
            productId: string;
            warehouseId: string;
            qty: number;
          }>
        >`
          SELECT id, status, "expiresAt", "productId", "warehouseId", qty
          FROM reservations
          WHERE id = ${params.id}
          FOR UPDATE
        `;

        if (reservations.length === 0) {
          return { type: "NOT_FOUND" as const };
        }

        const reservation = reservations[0];
        const now = new Date();

        // Already confirmed — idempotent success
        if (reservation.status === "CONFIRMED") {
          return { type: "ALREADY_CONFIRMED" as const };
        }

        // Released or expired
        if (
          reservation.status === "RELEASED" ||
          reservation.expiresAt < now
        ) {
          // Release stock if it was still pending but now expired
          if (
            reservation.status === "PENDING" &&
            reservation.expiresAt < now
          ) {
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { status: "RELEASED", releasedAt: now },
            });
            await tx.stock.update({
              where: {
                productId_warehouseId: {
                  productId: reservation.productId,
                  warehouseId: reservation.warehouseId,
                },
              },
              data: { reservedQty: { decrement: reservation.qty } },
            });
          }
          return { type: "EXPIRED" as const };
        }

        if (reservation.status !== "PENDING") {
          return { type: "INVALID_STATUS" as const, status: reservation.status };
        }

        // Confirm: reservation stays reserved (stock already decremented at reserve time)
        // We just update status — the reservedQty will decrease and totalQty is the permanent record
        const updated = await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: "CONFIRMED", confirmedAt: now },
          include: { product: true, warehouse: true },
        });

        // On confirm: decrement TOTAL qty (sale is final) and remove from reserved
        await tx.stock.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            totalQty: { decrement: reservation.qty },
            reservedQty: { decrement: reservation.qty },
          },
        });

        return { type: "SUCCESS" as const, reservation: updated };
      });

      if (result.type === "NOT_FOUND") {
        return notFound("Reservation not found");
      }

      if (result.type === "EXPIRED") {
        return gone(
          "This reservation has expired. The hold has been released and the units are available again."
        );
      }

      if (result.type === "INVALID_STATUS") {
        return conflict(
          `Cannot confirm a reservation with status: ${result.status}`
        );
      }

      if (result.type === "ALREADY_CONFIRMED") {
        return ok({ message: "Reservation already confirmed", status: "CONFIRMED" });
      }

      const { reservation } = result;

      return ok({
        id: reservation.id,
        status: reservation.status,
        confirmedAt: reservation.confirmedAt?.toISOString(),
        productName: reservation.product.name,
        warehouseName: reservation.warehouse.name,
        qty: reservation.qty,
        totalPrice: reservation.product.price * reservation.qty,
        message: "Reservation confirmed successfully. Your order is being processed.",
      });
    } catch (error) {
      return handleUnknownError(error);
    }
  });
}
