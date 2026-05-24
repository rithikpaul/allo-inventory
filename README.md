# Allo Inventory — Multi-Warehouse Reservation System

A production-grade inventory reservation system built for Allo's take-home exercise. Handles the classic checkout race condition: temporarily holding stock during payment without permanently decrementing it.

**Live demo:** `https://your-app.vercel.app`  
**GitHub:** `https://github.com/your-username/allo-inventory`

---

## The Core Problem

When two customers try to buy the last unit simultaneously, a naive system lets both pay — then one gets a refund and ops cleans up manually. The solution is a **time-bounded reservation**:

1. Customer proceeds to checkout → units are **reserved** (not sold) for 10 minutes
2. Payment completes → reservation is **confirmed**, stock permanently decremented  
3. Payment fails or timer runs out → reservation is **released**, units return to available

---

## How Concurrency is Handled

This is the heart of the exercise. The reservation endpoint uses **Postgres row-level locking via `SELECT ... FOR UPDATE`** inside a transaction:

```sql
BEGIN;
  -- Acquire exclusive lock on the stock row for this product+warehouse.
  -- A second concurrent request for the same SKU will WAIT here until
  -- this transaction commits or rolls back.
  SELECT id, "totalQty", "reservedQty"
  FROM stock
  WHERE "productId" = $1 AND "warehouseId" = $2
  FOR UPDATE;

  -- After the lock is acquired, re-check available stock.
  -- If the first request already took the last unit, this check fails → 409.
  -- Check: availableQty = totalQty - reservedQty >= requested qty

  -- Atomically increment reservedQty
  UPDATE stock SET "reservedQty" = "reservedQty" + $qty WHERE ...;

  -- Create reservation record
  INSERT INTO reservations (...) VALUES (...);
COMMIT;
```

**Why this approach:**
- Two simultaneous requests for the last unit are serialized at the database level
- The second request sees the updated `reservedQty` after the first commits, fails the stock check, and returns 409
- No application-level distributed lock needed — Postgres is already the source of truth
- Correct under any number of concurrent requests, not just two

**Alternatives considered:**
- **Optimistic locking (version column):** Would require retry logic in the application layer. More complex, not necessarily faster.
- **Redis SETNX:** A distributed lock *before* touching the DB. Adds a dependency and failure mode (Redis goes down) without adding correctness when Postgres is already serializing writes.
- **Serializable isolation level:** Would work but causes more transaction aborts/retries for unrelated rows. Row-level locking is more surgical.

The same `FOR UPDATE` pattern is used in the confirm and release endpoints to prevent double-confirms and double-releases.

---

## Reservation Expiry

Two-layer approach:

### Layer 1: Vercel Cron (primary)
`vercel.json` schedules `GET /api/cron/expire` to run **every minute**. The endpoint:
1. Finds all `PENDING` reservations where `expiresAt < NOW()`
2. Releases each one in a transaction (set status → `RELEASED`, decrement `reservedQty`)
3. Also cleans up expired idempotency records

The endpoint is protected by a `CRON_SECRET` header in production so it can't be called externally.

### Layer 2: Lazy cleanup on read (belt-and-suspenders)
`GET /api/products` sweeps for expired reservations before returning stock data. This means even if the cron hasn't run yet, the product listing always shows accurate available stock.

`GET /api/reservations/:id` also checks expiry on read and releases inline if the reservation is past its `expiresAt`.

**Why both?**
The cron ensures expired reservations don't accumulate. The lazy cleanup ensures the UI is always accurate even between cron runs. Neither alone is sufficient.

---

## Idempotency (Bonus)

The `POST /api/reservations` and `POST /api/reservations/:id/confirm` endpoints support idempotency via the `Idempotency-Key` header.

**How it works:**
1. Client sends `Idempotency-Key: <unique-string>` with the request
2. Server checks the `idempotency_records` table for this key
3. If found → return the cached response (same status code, same body) with `X-Idempotency-Replayed: true` header
4. If not found → execute the request, store `(key, status_code, response_body)` in the table, return normally
5. Records expire after 24 hours (cleaned by the cron job)

This means a client can safely retry a failed request (network timeout, etc.) without creating duplicate reservations.

**Implementation:** Postgres-backed (no Redis needed). The `idempotencyKey` is stored as a unique constraint — concurrent retries are handled by the unique violation rather than a race condition.

---

## Data Model

```
Product          — name, SKU, description, category, price
Warehouse        — name, location, city, country
Stock            — productId + warehouseId + totalQty + reservedQty (unique per pair)
Reservation      — productId, warehouseId, qty, status, expiresAt, customerName/Email
IdempotencyRecord — key, statusCode, responseBody, expiresAt
```

**Key design decision:** `availableQty` is computed as `totalQty - reservedQty` — it's never stored. This means the lock on the `Stock` row is the single point of truth for availability, and there's no opportunity for them to diverge.

On **confirm**: both `totalQty` and `reservedQty` are decremented (the unit is permanently sold).  
On **release**: only `reservedQty` is decremented (unit goes back to available pool).

---

## API Reference

| Method | Path | Status Codes | Description |
|--------|------|-------------|-------------|
| `GET` | `/api/products` | 200 | Products with per-warehouse stock. Runs lazy expiry sweep. |
| `GET` | `/api/warehouses` | 200 | Warehouses with stats |
| `POST` | `/api/reservations` | 201, 400, 409 | Reserve units. 409 if insufficient stock. Supports `Idempotency-Key`. |
| `GET` | `/api/reservations` | 200 | List reservations (with optional `?status=PENDING`) |
| `GET` | `/api/reservations/:id` | 200, 404 | Single reservation detail |
| `POST` | `/api/reservations/:id/confirm` | 200, 404, 409, 410 | Confirm reservation. 410 if expired. |
| `POST` | `/api/reservations/:id/release` | 200, 404, 409 | Release early. 409 if already confirmed. |
| `GET` | `/api/cron/expire` | 200, 401 | Cron job endpoint. Requires `Authorization: Bearer <CRON_SECRET>` in production. |

---

## Running Locally

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) account (free tier is enough)

### Setup

```bash
# 1. Clone
git clone https://github.com/your-username/allo-inventory
cd allo-inventory

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and paste your Neon connection strings

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed sample data
npm run db:seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
DATABASE_URL=       # Neon pooled connection string
DIRECT_URL=         # Neon direct connection string (for migrations)
CRON_SECRET=        # Any random string (e.g. openssl rand -hex 32)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL, DIRECT_URL, CRON_SECRET, NEXT_PUBLIC_APP_URL

# Run migrations against production DB
DATABASE_URL="<your-neon-url>" npx prisma migrate deploy

# Seed production DB
DATABASE_URL="<your-neon-url>" npm run db:seed
```

The cron job in `vercel.json` runs automatically once deployed.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Server components + API routes in one project |
| Database | Neon (hosted Postgres) | Free tier, Vercel integration, supports `FOR UPDATE` |
| ORM | Prisma | Type-safe queries + raw SQL for locking |
| Validation | Zod | Shared schemas between API and frontend |
| Styling | Tailwind + custom CSS | Fast layout + full design control |
| Deployment | Vercel | Native Next.js hosting + cron jobs |

---

## Trade-offs & What I'd Do Differently

**What's here:**
- ✅ Correct concurrency with row-level locking
- ✅ Two-layer expiry (cron + lazy)
- ✅ Idempotency for reserve and confirm
- ✅ Full error visibility in the UI (409, 410 shown clearly)
- ✅ Zod validation on all inputs
- ✅ Live countdown timer
- ✅ TypeScript end-to-end

**What I'd add with more time:**
- **Auth:** Right now any user can confirm/release any reservation. In production, tie reservations to sessions or user accounts.
- **Webhook notifications:** Notify downstream systems (ERP, 3PL) on confirm.
- **Multi-warehouse smart routing:** Auto-select the nearest warehouse with stock rather than requiring the user to pick.
- **Concurrency tests:** A proper test suite with `Promise.all` firing 100 simultaneous reservation requests to verify exactly one succeeds.
- **Metrics/observability:** Track reservation conversion rates, expiry rates per warehouse, etc.
- **Optimistic UI updates:** Currently `router.refresh()` causes a small flash; SWR or React Query would give smoother updates.
- **Retry logic on the client:** Expose the idempotency key to the user for safe retries on network failure.

**Deliberate simplifications:**
- No authentication — out of scope for this exercise
- No payment processor integration — the "Confirm" button simulates payment success
- Cron granularity is 1 minute (Vercel free tier limit) — in production you'd want finer granularity or a persistent worker
