import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, conflict, handleUnknownError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservations = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          productId: string;
          warehouseId: string;
          qty: number;
        }>
      >`
        SELECT id, status, "productId", "warehouseId", qty
        FROM reservations
        WHERE id = ${params.id}
        FOR UPDATE
      `;

      if (reservations.length === 0) {
        return { type: "NOT_FOUND" as const };
      }

      const reservation = reservations[0];

      // Already released — idempotent
      if (reservation.status === "RELEASED") {
        return { type: "ALREADY_RELEASED" as const };
      }

      if (reservation.status === "CONFIRMED") {
        return { type: "ALREADY_CONFIRMED" as const };
      }

      const now = new Date();

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "RELEASED", releasedAt: now },
      });

      // Give the units back
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: { reservedQty: { decrement: reservation.qty } },
      });

      return { type: "SUCCESS" as const };
    });

    if (result.type === "NOT_FOUND") {
      return notFound("Reservation not found");
    }

    if (result.type === "ALREADY_CONFIRMED") {
      return conflict("Cannot release a confirmed reservation. Contact support to process a refund.");
    }

    return ok({
      message:
        result.type === "ALREADY_RELEASED"
          ? "Reservation was already released"
          : "Reservation released. Units are now available to other shoppers.",
      status: "RELEASED",
    });
  } catch (error) {
    return handleUnknownError(error);
  }
}
