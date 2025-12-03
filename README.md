## Flash Sale System – React, Node, MySQL, Redis

Mini flash‑sale platform with race‑safe inventory, 2‑minute holds, background worker, and live admin dashboard.

---

### Project structure

- **server/** – Node.js + Express backend
  - `src/config/` – app config and Sequelize setup
  - `src/models/` – Sequelize models (`Product`, `Order`, `InventoryEvent`, `User`)
  - `src/controllers/` – HTTP controllers
  - `src/services/` – business logic (holds, orders, metrics)
  - `src/routes/` – `/api/...` and `/api/admin/...` routes
  - `src/workers/holdExpiryWorker.js` – background worker to expire holds
  - `src/seeders/seed.js` – seed script for demo data
- **client/** – React + Vite + Tailwind frontend
  - `src/pages/` – `Storefront`, `Checkout`, `OrderHistory`, `AdminDashboard`, `Login`
  - `src/components/` – `ProductCard`, `BuyModal`, `Countdown`, `StatCard`
  - `src/api/` – API clients (Axios) using React Query for polling

---

### Data schema

Implemented via Sequelize models (synced at startup, no migrations):

- **products**
  - `id` (pk)
  - `name`, `description`, `price`
  - `total_stock` (integer) – *current* stock remaining
  - `sale_starts_at`, `sale_ends_at`
  - `created_at` (timestamp, default now)

- **orders**
  - `id` (pk)
  - `product_id` (fk → products.id)
  - `customer_email`
  - `quantity`
  - `status` – ENUM(`pending`, `confirmed`, `expired`, `cancelled`)
  - `hold_expires_at` (timestamp)
  - `created_at` (timestamp, default now)

- **inventory_events**
  - `id` (pk)
  - `product_id` (fk → products.id)
  - `type` – ENUM(`stock_added`, `hold_created`, `hold_released`, `order_confirmed`)
  - `delta` (integer, +/-)
  - `metadata` (JSON)
  - `created_at` (timestamp, default now)

- **users**
  - `id` (pk)
  - `email` (unique)
  - `password_hash`
  - `role` – ENUM(`customer`, `admin`)
  - `created_at`

---

### Locking and stock handling

- **Available stock is stored in MySQL (`products.total_stock`)**, not Redis.
- **Holds** (`POST /api/holds`):
  - Acquire Redis lock: `lock:product:<productId>` using a unique value + short TTL.
  - Within the lock, run conditional update:
    - `UPDATE products SET total_stock = total_stock - :qty WHERE id = :id AND total_stock >= :qty`
    - If no rows updated ⇒ insufficient stock ⇒ rollback, release lock, count as oversell attempt blocked.
  - Create `orders` row with `status='pending'`, `hold_expires_at = NOW + 2 minutes`.
  - Create `inventory_events` row `type='hold_created'`, `delta = -qty`.
  - Set Redis key `hold:<orderId>` with TTL 120s (for quick expiry tracking).
- **Confirm** (`POST /api/orders/:id/confirm`):
  - If hold already expired: mark order `expired`, restore stock (`+quantity`), add `hold_released` event, delete Redis key.
  - Else within a DB transaction: lock the order row, ensure `status='pending'`, set `status='confirmed'`, log `order_confirmed` event, delete Redis key.
- **Background expiry worker** (`src/workers/holdExpiryWorker.js`):
  - Runs every 30 seconds via `node-cron`.
  - Finds `orders` where `status='pending' AND hold_expires_at <= NOW`.
  - For each, in a transaction: mark `expired`, increment `products.total_stock` by `quantity`, insert `inventory_events` (`hold_released`), delete Redis `hold:<orderId>`.

**Race‑safety:** The combination of Redis lock **per product** and conditional SQL update guarantees no overselling, even under concurrent hold requests.

**Alternatives (trade‑offs):**

- **DB row locking only**: lock the product row (`SELECT ... FOR UPDATE`) and compute stock without Redis; simpler but higher DB contention.
- **Redis `WATCH`/`MULTI`**: track stock counters in Redis and use optimistic locking; faster reads but requires more complex reconciliation with DB.
- **Redis Lua scripts**: atomic multi‑key operations (lock + stock change + hold creation flags); powerful but more opaque and harder to debug than SQL‑first approach.

This implementation keeps **source of truth in MySQL** and uses Redis only for **locking, counters, and TTL tracking**.

---

### Backend environment variables (`server/.env`)

Create `server/.env`:

```bash
# Server
PORT=8080

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=flashsale_db
DB_USER=root
DB_PASS=your_db_password
DB_DIALECT=mysql

# Redis
REDIS_URL=redis://localhost:6379

# Auth / CORS
JWT_SECRET=super_secret_jwt_key_change_me
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123
```

---

### Frontend environment variables (`client/.env`, optional)

The frontend defaults to `http://localhost:8080` if not set, but you can configure environments with:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

Place this in `client/.env` if you want to override the default.

---

### Install & run

From the project root:

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

#### Running the backend API

From `server/`:

```bash
# Start API (http://localhost:8080)
npm run dev
# or
npm start
```

#### Running the background worker

From `server/`:

```bash
npm run worker
```

This starts `src/workers/holdExpiryWorker.js`, which scans for expired holds every 30 seconds.

#### Seeding demo data

From `server/` (after DB is reachable):

```bash
npm run seed
```

This will:

- Sync the schema,
- Insert a couple of demo `products` with a live sale window,
- Create an admin user (from env):
  - **email:** `ADMIN_EMAIL` from `.env` (default `admin@example.com`)
  - **password:** `ADMIN_PASSWORD` from `.env` (default `admin123`)

#### Running the frontend

From `client/`:

```bash
npm run dev
```

Visit `http://localhost:5173`.

---

### Frontend behavior (React + Tailwind + React Query)

- **Storefront (`Storefront.jsx`)**
  - Uses React Query to call `GET /api/products/live` with `refetchInterval` ≈ 7s.
  - Shows cards (`ProductCard`) with price, live stock, percent sold, and sale countdown (`Countdown`).
  - “Buy now” opens `BuyModal` to choose quantity and create a hold (`POST /api/holds`), then routes to `/checkout/:orderId`.

- **Checkout (`Checkout.jsx`)**
  - Fetches `GET /api/orders/:id`.
  - Shows product, quantity, price, and a 2‑minute hold countdown (`Countdown`).
  - “Confirm order” calls `POST /api/orders/:id/confirm`; handles expired holds gracefully.

- **Order history (`OrderHistory.jsx`)**
  - Polls `GET /api/orders` every ~15 seconds.
  - Displays a table of pending / confirmed / expired orders with badges and timestamps.

- **Admin dashboard (`AdminDashboard.jsx`)**
  - Polls `GET /api/admin/metrics` and `GET /api/admin/products` every 5 seconds using React Query.
  - Shows:
    - Stat cards (`StatCard`) for total products, stock, pending/confirmed/expired, oversell attempts, inventory event count.
    - Recharts stacked bar chart (pending vs confirmed vs expired per product).
    - Live inventory table (stock + per‑status quantities).

- **Auth (`Login.jsx`)**
  - Email/password login & registration via `/api/auth/login` and `/api/auth/register`.
  - JWT token and user info stored in `localStorage`.
  - Admin‑only routes (`/admin`) protected client‑side; backend also enforces admin role.

---

### Demo test cases

Use these to validate the system end‑to‑end:

- **Concurrent hold attempts**
  - Open two browsers, log in as two different customers.
  - Rapidly try to create holds near the stock limit for the same product.
  - Expected: some holds fail with “Insufficient stock” and `oversell_attempts_blocked` in admin metrics increases; total confirmed + pending never exceeds initial stock.

- **Hold expiry**
  - Create a hold, wait > 2 minutes without confirming.
  - Expected: worker or confirm logic marks order `expired`, restores stock, inventory events show `hold_released`.

- **Oversell prevention**
  - Seed a product with low stock (e.g., 2 units) and try to create holds totaling more than 2.
  - Expected: only the first one or two succeed; later holds get an error and admin metrics show oversell attempts blocked.

- **Admin dashboard live updates**
  - Open `/admin` as `admin@example.com`.
  - From another browser, perform holds and confirms.
  - Expected: pending/confirmed/expired stats, chart, and inventory table update every 5 seconds without refresh.

## 📸 Screenshots

Below are the screenshots of my assessment pages for easy reference:

1) Dashboard Page :-
   <img width="1366" height="663" alt="image" src="https://github.com/user-attachments/assets/7233239b-ce24-4dde-a85f-d0443ab44dbb" />

2) Login Page :-

   <img width="1366" height="636" alt="image" src="https://github.com/user-attachments/assets/05ce4f69-5605-479d-9131-fbde676acd09" />

3) Purchase Page :-

   <img width="1366" height="656" alt="image" src="https://github.com/user-attachments/assets/e36b0051-8262-4b23-b19d-e0d1ba7fcae8" />

4) Oders And checkout Page :-

   <img width="1366" height="668" alt="image" src="https://github.com/user-attachments/assets/db660e15-27b6-4ed1-a84b-483ac311eecd" />

5) Order confirm toastify message :-

   <img width="1366" height="691" alt="image" src="https://github.com/user-attachments/assets/7b02a505-3472-426e-996d-33a7da7882bd" />

6) Admin Products Dashboard :-

   <img width="1366" height="681" alt="image" src="https://github.com/user-attachments/assets/6d585f10-a3d4-42ca-9410-aa43cc15ffd7" />

7) Admin Real time Inventory Dashboard for analysis :-

   <img width="1364" height="581" alt="image" src="https://github.com/user-attachments/assets/16de003a-953b-4bfd-84aa-bdb14f8b8d34" />

   <img width="1351" height="390" alt="image" src="https://github.com/user-attachments/assets/d44b0e1e-c8be-40df-872e-5f825232e128" />








