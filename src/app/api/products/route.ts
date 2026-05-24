import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleUnknownError } from "@/lib/api";
import { ProductListQuerySchema, ProductWithStock } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = ProductListQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      warehouseId: searchParams.get("warehouseId") ?? undefined,
      inStockOnly: searchParams.get("inStockOnly") ?? undefined,
    });

    // Auto-release expired reservations before returning stock (lazy cleanup)
    const now = new Date();
    const expired = await prisma.reservation.findMany({
      where: { status: "PENDING", expiresAt: { lt: now } },
      select: { id: true, productId: true, warehouseId: true, qty: true },
    });

    if (expired.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const r of expired) {
          await tx.reservation.update({
            where: { id: r.id },
            data: { status: "RELEASED", releasedAt: now },
          });
          await tx.stock.update({
            where: {
              productId_warehouseId: {
                productId: r.productId,
                warehouseId: r.warehouseId,
              },
            },
            data: { reservedQty: { decrement: r.qty } },
          });
        }
      });
    }

    // Build product query
    const products = await prisma.product.findMany({
      where: query.success && query.data.category
        ? { category: query.data.category }
        : undefined,
      include: {
        stock: {
          where:
            query.success && query.data.warehouseId
              ? { warehouseId: query.data.warehouseId }
              : undefined,
          include: {
            warehouse: true,
          },
          orderBy: { warehouse: { city: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    });

    const result: ProductWithStock[] = products
      .map((p) => {
        const stockItems = p.stock.map((s) => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouse.name,
          warehouseCity: s.warehouse.city,
          totalQty: s.totalQty,
          reservedQty: s.reservedQty,
          availableQty: Math.max(0, s.totalQty - s.reservedQty),
        }));

        const totalAvailable = stockItems.reduce(
          (sum, s) => sum + s.availableQty,
          0
        );

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          description: p.description,
          imageUrl: p.imageUrl,
          category: p.category,
          price: p.price,
          stock: stockItems,
          totalAvailable,
        };
      })
      .filter((p) => {
        if (query.success && query.data.inStockOnly) {
          return p.totalAvailable > 0;
        }
        return true;
      });

    return ok({
      products: result,
      meta: {
        total: result.length,
        inStock: result.filter((p) => p.totalAvailable > 0).length,
        expiredReleased: expired.length,
      },
    });
  } catch (error) {
    return handleUnknownError(error);
  }
}
