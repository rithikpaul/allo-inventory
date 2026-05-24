import { prisma } from "./prisma";
import { NextResponse } from "next/server";

const IDEMPOTENCY_TTL_HOURS = 24;

/**
 * Check if an idempotency key has been seen before.
 * If yes, return the cached response immediately.
 * If no, run the handler and cache the result.
 *
 * Usage:
 *   const idempotencyKey = req.headers.get("Idempotency-Key");
 *   return withIdempotency(idempotencyKey, async () => {
 *     // your actual handler logic
 *     return created({ id: "..." });
 *   });
 */
export async function withIdempotency(
  key: string | null,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // No key provided — just run the handler normally
  if (!key) {
    return handler();
  }

  // Trim and validate the key
  const trimmedKey = key.trim();
  if (!trimmedKey || trimmedKey.length > 255) {
    return handler();
  }

  try {
    // Check for existing record
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { key: trimmedKey },
    });

    if (existing) {
      // Return cached response — same status, same body
      const body = JSON.parse(existing.responseBody);
      return NextResponse.json(body, {
        status: existing.statusCode,
        headers: {
          "X-Idempotency-Replayed": "true",
          "X-Idempotency-Key": trimmedKey,
        },
      });
    }

    // Run the actual handler
    const response = await handler();

    // Cache the result
    const responseBody = await response.json();
    const expiresAt = new Date(
      Date.now() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000
    );

    await prisma.idempotencyRecord.create({
      data: {
        key: trimmedKey,
        statusCode: response.status,
        responseBody: JSON.stringify(responseBody),
        expiresAt,
      },
    });

    // Re-construct the response since we consumed it above
    return NextResponse.json(responseBody, {
      status: response.status,
      headers: {
        "X-Idempotency-Key": trimmedKey,
      },
    });
  } catch (error) {
    console.error("Idempotency error:", error);
    // If idempotency fails, fall through to normal handler
    return handler();
  }
}

/**
 * Clean up expired idempotency records.
 * Called by the cron job.
 */
export async function cleanExpiredIdempotencyRecords(): Promise<number> {
  const result = await prisma.idempotencyRecord.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
