import { prisma } from "@/lib/prisma";
import { ok, handleUnknownError } from "@/lib/api";
import { WarehouseWithStats } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        stock: true,
        _count: {
          select: { reservations: { where: { status: "PENDING" } } },
        },
      },
      orderBy: { city: "asc" },
    });

    const result: WarehouseWithStats[] = warehouses.map((w) => {
      const totalUnits = w.stock.reduce((sum, s) => sum + s.totalQty, 0);
      const reservedUnits = w.stock.reduce((sum, s) => sum + s.reservedQty, 0);

      return {
        id: w.id,
        name: w.name,
        location: w.location,
        city: w.city,
        country: w.country,
        totalProducts: w.stock.length,
        totalUnits,
        reservedUnits,
        availableUnits: totalUnits - reservedUnits,
        activeReservations: w._count.reservations,
      };
    });

    return ok({ warehouses: result });
  } catch (error) {
    return handleUnknownError(error);
  }
}
