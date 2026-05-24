import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status: 400 });
}

export function notFound(error = "Resource not found") {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error: string) {
  return NextResponse.json({ error, code: "CONFLICT" }, { status: 409 });
}

export function gone(error: string) {
  return NextResponse.json({ error, code: "EXPIRED" }, { status: 410 });
}

export function internalError(error: string) {
  return NextResponse.json({ error }, { status: 500 });
}

export function unauthorized(error = "Unauthorized") {
  return NextResponse.json({ error }, { status: 401 });
}

export function handleZodError(error: ZodError) {
  return badRequest("Validation failed", error.flatten().fieldErrors);
}

export function handleUnknownError(error: unknown) {
  console.error("Unhandled error:", error);
  if (error instanceof Error) {
    return internalError(error.message);
  }
  return internalError("An unexpected error occurred");
}

// RESERVATION_WINDOW_MINUTES: how long a reservation holds stock
export const RESERVATION_WINDOW_MINUTES = 10;

export function getExpiryTime(): Date {
  return new Date(Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000);
}

export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise);
}
