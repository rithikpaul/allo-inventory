import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, handleUnknownError } from "@/lib/api";
import { cleanExpiredIdempotencyRecords } from "@/lib/idempotency";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // Protect the cron endpoint — only Vercel cron or callers with the secret can trigger it
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, require the secret. In dev, allow open access.
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return unauthorized("Invalid cron secret");
    }
  }

  try {
    const now = new Date();

    // Find all expired PENDING reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        productId: true,
        warehouseId: true,
        qty: true,
        expiresAt: true,
      },
    });

    let released = 0;
    let errors = 0;

    // Release each expired reservation
    for (const reservation of expiredReservations) {
      try {
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
        released++;
      } catch (err) {
        console.error(`Failed to release reservation ${reservation.id}:`, err);
        errors++;
      }
    }

    // Clean up expired idempotency records
    const idempotencyDeleted = await cleanExpiredIdempotencyRecords();

    console.log(
      `[CRON] Expiry run: ${released} released, ${errors} errors, ${idempotencyDeleted} idempotency records cleaned`
    );

    return ok({
      success: true,
      timestamp: now.toISOString(),
      released,
      errors,
      idempotencyRecordsDeleted: idempotencyDeleted,
      message: `Released ${released} expired reservation(s)`,
    });
  } catch (error) {
    return handleUnknownError(error);
  }
}
