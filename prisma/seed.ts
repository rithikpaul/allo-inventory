import { PrismaClient, ReservationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.idempotencyRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create Warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: "Mumbai Central Hub",
        location: "Bhiwandi Industrial Area",
        city: "Mumbai",
        country: "India",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "Delhi North Fulfillment",
        location: "Kundli Industrial Estate",
        city: "Delhi",
        country: "India",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "Bangalore Tech Depot",
        location: "Whitefield Industrial Zone",
        city: "Bangalore",
        country: "India",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "Chennai South Hub",
        location: "Ambattur Industrial Estate",
        city: "Chennai",
        country: "India",
      },
    }),
  ]);

  console.log(`✅ Created ${warehouses.length} warehouses`);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Sony WH-1000XM5 Headphones",
        sku: "SONY-WH1000XM5-BLK",
        description:
          "Industry-leading noise canceling with Auto NC Optimizer. Up to 30-hour battery life with quick charging. Crystal clear hands-free calling.",
        category: "Electronics",
        price: 24990,
        imageUrl:
          "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400",
      },
    }),
    prisma.product.create({
      data: {
        name: "Apple iPad Air 11-inch M2",
        sku: "APPLE-IPAD-AIR-M2-256",
        description:
          "Supercharged by the M2 chip. Stunning 11-inch Liquid Retina display. All-day battery life up to 10 hours. USB-C connectivity.",
        category: "Electronics",
        price: 74900,
        imageUrl:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
      },
    }),
    prisma.product.create({
      data: {
        name: "Nike Air Max 270 React",
        sku: "NIKE-AM270-WHT-42",
        description:
          "Inspired by the original Air Max 270, this running shoe delivers an extremely smooth ride. React foam midsole delivers a super-responsive feel.",
        category: "Footwear",
        price: 12995,
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      },
    }),
    prisma.product.create({
      data: {
        name: "Dyson V15 Detect Cordless",
        sku: "DYSON-V15-DET-GLD",
        description:
          "Laser reveals microscopic dust. Piezo sensor counts and sizes particles. Automatically adapts suction to maintain performance.",
        category: "Home Appliances",
        price: 52900,
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      },
    }),
    prisma.product.create({
      data: {
        name: "Levi's 512 Slim Taper Jeans",
        sku: "LEVIS-512-SLIM-32x30",
        description:
          "Slim through the seat and thigh, tapered to the ankle. Made with stretch fabric for all-day comfort. Classic 5-pocket styling.",
        category: "Apparel",
        price: 3999,
        imageUrl:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
      },
    }),
    prisma.product.create({
      data: {
        name: "Weber Spirit II E-310 Grill",
        sku: "WEBER-SPIRIT-E310-BLK",
        description:
          "3 stainless steel burners, porcelain-enameled cast-iron grates. 10-year warranty on all parts. Built-in lid thermometer.",
        category: "Outdoor",
        price: 45000,
        imageUrl:
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create Stock — varied levels to make demo interesting
  const stockData = [
    // Sony Headphones — low stock to demonstrate 409
    { productIdx: 0, warehouseIdx: 0, total: 3, reserved: 1 },
    { productIdx: 0, warehouseIdx: 1, total: 8, reserved: 2 },
    { productIdx: 0, warehouseIdx: 2, total: 1, reserved: 0 }, // last unit!
    { productIdx: 0, warehouseIdx: 3, total: 5, reserved: 1 },

    // iPad Air
    { productIdx: 1, warehouseIdx: 0, total: 12, reserved: 3 },
    { productIdx: 1, warehouseIdx: 1, total: 7, reserved: 0 },
    { productIdx: 1, warehouseIdx: 2, total: 4, reserved: 2 },
    { productIdx: 1, warehouseIdx: 3, total: 9, reserved: 1 },

    // Nike Shoes
    { productIdx: 2, warehouseIdx: 0, total: 20, reserved: 5 },
    { productIdx: 2, warehouseIdx: 1, total: 15, reserved: 3 },
    { productIdx: 2, warehouseIdx: 2, total: 0, reserved: 0 }, // out of stock!
    { productIdx: 2, warehouseIdx: 3, total: 6, reserved: 1 },

    // Dyson Vacuum
    { productIdx: 3, warehouseIdx: 0, total: 5, reserved: 2 },
    { productIdx: 3, warehouseIdx: 1, total: 3, reserved: 1 },
    { productIdx: 3, warehouseIdx: 2, total: 8, reserved: 0 },
    { productIdx: 3, warehouseIdx: 3, total: 2, reserved: 0 },

    // Levi's Jeans
    { productIdx: 4, warehouseIdx: 0, total: 30, reserved: 4 },
    { productIdx: 4, warehouseIdx: 1, total: 25, reserved: 2 },
    { productIdx: 4, warehouseIdx: 2, total: 18, reserved: 6 },
    { productIdx: 4, warehouseIdx: 3, total: 10, reserved: 1 },

    // Weber Grill
    { productIdx: 5, warehouseIdx: 0, total: 4, reserved: 1 },
    { productIdx: 5, warehouseIdx: 1, total: 2, reserved: 0 },
    { productIdx: 5, warehouseIdx: 2, total: 6, reserved: 2 },
    { productIdx: 5, warehouseIdx: 3, total: 1, reserved: 1 }, // fully reserved!
  ];

  await Promise.all(
    stockData.map(({ productIdx, warehouseIdx, total, reserved }) =>
      prisma.stock.create({
        data: {
          productId: products[productIdx].id,
          warehouseId: warehouses[warehouseIdx].id,
          totalQty: total,
          reservedQty: reserved,
        },
      })
    )
  );

  console.log(`✅ Created ${stockData.length} stock entries`);

  // Create a sample reservation that's already confirmed
  await prisma.reservation.create({
    data: {
      productId: products[0].id,
      warehouseId: warehouses[0].id,
      qty: 1,
      status: ReservationStatus.CONFIRMED,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      confirmedAt: new Date(),
      customerName: "Demo User",
      customerEmail: "demo@example.com",
    },
  });

  console.log("✅ Created sample confirmed reservation");
  console.log("\n🎉 Database seeded successfully!");
  console.log("\nWarehouse IDs:");
  warehouses.forEach((w) => console.log(`  ${w.name}: ${w.id}`));
  console.log("\nProduct IDs:");
  products.forEach((p) => console.log(`  ${p.name}: ${p.id}`));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
