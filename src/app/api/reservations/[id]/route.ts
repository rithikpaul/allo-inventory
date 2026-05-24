import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, handleUnknownError } from "@/lib/api";
import { ReservationDetail } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: { product: true, warehouse: true },
    });

    if (!reservation) {
      return notFound("Reservation not found");
    }

    const now = new Date();

    // Lazy expiry check: if pending and past expiry, release it
    if (reservation.status === "PENDING" && reservation.expiresAt < now) {
      await prisma.$transaction(async (tx) => {
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
      });
      reservation.status = "RELEASED";
      reservation.releasedAt = now;
    }

    const secondsRemaining =
      reservation.status === "PENDING"
        ? Math.max(
            0,
            Math.floor((reservation.expiresAt.getTime() - now.getTime()) / 1000)
          )
        : 0;

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

    return ok(response);
  } catch (error) {
    return handleUnknownError(error);
  }
}
