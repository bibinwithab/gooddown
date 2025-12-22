# Backend Implementation Guide

**Document Version:** 1.0.0  
**Last Updated:** December 2025  
**Technology:** Node.js + Express + PostgreSQL

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Components](#core-components)
3. [Route Handlers](#route-handlers)
4. [Database Operations](#database-operations)
5. [Middleware & Configuration](#middleware--configuration)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Development Workflow](#development-workflow)

---

## Project Structure

```
backend/
├── db.js                    # Database pool configuration
├── server.js                # Express app initialization
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables
├── .env.example             # Template for .env
├── public/                  # Static files (React build)
│   ├── index.html
│   └── assets/
│       ├── *.js
│       └── *.css
└── routes/
    ├── materials.js         # Material CRUD operations
    ├── owners.js            # Owner management
    ├── transactions.js       # Transaction processing
    ├── ledger.js            # Ledger & balance calculations
    ├── vehicles.js          # Vehicle management
    ├── reports.js           # Report generation
    ├── bills.js             # Bill processing
    └── weekly-reports.js    # Weekly summaries
```

---

## Core Components

### 1. Database Connection (db.js)

**Purpose:** Centralized PostgreSQL connection pool

```javascript
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432,
});

export default pool;
```

**Configuration:**

- Connection pooling for performance
- Automatic reconnection on failure
- Environment-based credentials
- Max connections: 20 (default)

### 2. Express Server (server.js)

**Purpose:** API server initialization and middleware setup

**Key Features:**

```javascript
// 1. CORS Configuration
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

// 2. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static Files
app.use(express.static(publicPath));

// 4. Route Mounting
app.use("/api/materials", materialsRouter);
app.use("/api/owners", ownersRouter);
// ... other routes
```

**Initialization Flow:**

1. Load environment variables (dotenv)
2. Create Express app
3. Configure CORS & middleware
4. Mount route handlers
5. Serve static files
6. Start listening on port

---

## Route Handlers

### Route Structure Pattern

Each route file follows this pattern:

```javascript
import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET - Retrieve all
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM table");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Create
router.post("/", async (req, res) => {
  // Validation
  // Insert query
  // Response
});

// PUT - Update
router.put("/:id", async (req, res) => {
  // Update query
  // Response
});

export default router;
```

### 1. Materials Route (routes/materials.js)

**Endpoints:**

- `GET /api/materials` - List all materials
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material

**Key Operations:**

```javascript
// Get materials with search
SELECT * FROM materials
WHERE name ILIKE $1 OR code ILIKE $1
ORDER BY created_at DESC;

// Create material
INSERT INTO materials (name, code, unit_price, active)
VALUES ($1, $2, $3, $4)
RETURNING *;

// Update material
UPDATE materials
SET name = $1, unit_price = $2, updated_at = NOW()
WHERE id = $3
RETURNING *;
```

---

### 2. Owners Route (routes/owners.js)

**Endpoints:**

- `GET /api/owners` - List all owners
- `POST /api/owners` - Create owner
- `GET /api/owners/:id` - Get owner details

**Validations:**

```javascript
// Validate contact number (10 digits)
if (!/^\d{10}$/.test(req.body.contact)) {
  return res.status(422).json({ error: "Invalid contact number" });
}

// Check duplicate contact
const duplicate = await pool.query("SELECT id FROM owners WHERE contact = $1", [
  req.body.contact,
]);
if (duplicate.rows.length > 0) {
  return res.status(409).json({ error: "Contact already exists" });
}
```

---

### 3. Transactions Route (routes/transactions.js)

**Endpoints:**

- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions

**Processing Flow:**

```
1. Validate input (owner_id, material_id, quantity, price)
2. Check owner exists
3. Check material exists
4. Calculate total amount (quantity × unit_price)
5. Insert transaction
6. Trigger ledger recalculation
7. Return response with new balance
```

**Transaction Query:**

```javascript
const query = `
  INSERT INTO transactions 
  (owner_id, material_id, quantity, unit_price, vehicle_id, date)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, owner_id, total_amount;
`;

const result = await pool.query(query, [
  owner_id,
  material_id,
  quantity,
  unit_price,
  vehicle_id,
  date,
]);
```

---

### 4. Ledger Route (routes/ledger.js)

**Endpoints:**

- `GET /api/owners/:ownerId/ledger` - Get ledger with balance
- `POST /api/owners/:ownerId/payments` - Record payment

**Ledger Calculation (Window Functions):**

```sql
SELECT
  id,
  date,
  'CREDIT' as type,
  total_amount as amount,
  SUM(total_amount) OVER (
    PARTITION BY owner_id
    ORDER BY date, id
  ) as running_balance
FROM transactions
WHERE owner_id = $1
ORDER BY date, id;
```

**Current Balance Query:**

```sql
SELECT
  COALESCE(
    SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END),
    0
  ) as balance
FROM ledger_entries
WHERE owner_id = $1;
```

---

### 5. Vehicles Route (routes/vehicles.js)

**Endpoints:**

- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles?owner_id=X&q=search` - Search vehicles

**Search Implementation:**

```javascript
let query = `
  SELECT v.*, o.name as owner_name 
  FROM vehicles v
  JOIN owners o ON v.owner_id = o.id
  WHERE 1=1
`;
const params = [];

if (req.query.owner_id) {
  query += ` AND v.owner_id = $${params.length + 1}`;
  params.push(req.query.owner_id);
}

if (req.query.q) {
  query += ` AND (v.registration ILIKE $${
    params.length + 1
  } OR v.driver_name ILIKE $${params.length + 1})`;
  params.push(`%${req.query.q}%`);
  params.push(`%${req.query.q}%`);
}

query += ` ORDER BY v.created_at DESC`;
```

---

### 6. Reports Route (routes/reports.js)

**Endpoints:**

- `GET /api/reports/transactions` - Transaction report
- `GET /api/reports/summary` - Financial summary
- `GET /api/reports/weekly` - Weekly report

**Report Query:**

```sql
SELECT
  t.id,
  t.date,
  o.name as owner_name,
  m.name as material_name,
  t.quantity,
  t.unit_price,
  t.total_amount,
  v.registration as vehicle
FROM transactions t
JOIN owners o ON t.owner_id = o.id
JOIN materials m ON t.material_id = m.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.date BETWEEN $1 AND $2
ORDER BY t.date DESC;
```

---

### 7. Bills Route (routes/bills.js)

**Endpoints:**

- `GET /api/bills/:billId` - Get bill for printing
- `POST /api/bills/:billId/print` - Send to printer

**Bill Generation:**

```javascript
const bill = {
  bill_number: `BILL-${year}-${id}`,
  date: transaction.date,
  owner_name: owner.name,
  items: [
    {
      description: material.name,
      quantity: transaction.quantity,
      unit_price: transaction.unit_price,
      total: transaction.total_amount,
    },
  ],
  subtotal: transaction.total_amount,
  tax: calculateTax(transaction.total_amount),
  total: transaction.total_amount + tax,
};
```

---

### 8. Weekly Reports (routes/weekly-reports.js)

**Query Pattern:**

```sql
SELECT
  DATE_TRUNC('week', date) as week_start,
  o.name as owner_name,
  COUNT(*) as transaction_count,
  SUM(total_amount) as week_total
FROM transactions t
JOIN owners o ON t.owner_id = o.id
WHERE DATE_TRUNC('week', date) = $1
GROUP BY DATE_TRUNC('week', date), o.name
ORDER BY week_start DESC, owner_name;
```

---

## Database Operations

### 1. Connection Management

**Pool Configuration:**

```javascript
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000,
});
```

### 2. Query Execution

**Simple Query:**

```javascript
const result = await pool.query("SELECT * FROM owners WHERE id = $1", [
  ownerId,
]);
```

**Parameterized Queries (Prevents SQL Injection):**

```javascript
// Always use $1, $2, etc. for parameters
const query = `
  INSERT INTO transactions 
  (owner_id, material_id, quantity) 
  VALUES ($1, $2, $3)
`;
await pool.query(query, [owner_id, material_id, quantity]);
```

### 3. Transactions

**Begin/Commit/Rollback:**

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");

  // Multiple operations
  await client.query("INSERT INTO transactions ...");
  await client.query("UPDATE owners SET balance = ...");

  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```

---

## Middleware & Configuration

### 1. CORS Middleware

```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
```

### 2. Body Parser

```javascript
// For JSON
app.use(express.json());

// For URL-encoded forms
app.use(express.urlencoded({ extended: true }));
```

### 3. Static Files

```javascript
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

// Serve React app for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
```

---

## Error Handling

### 1. Try-Catch Pattern

```javascript
router.post("/", async (req, res) => {
  try {
    // Validation
    if (!req.body.name) {
      return res.status(422).json({
        success: false,
        error: { message: "Name is required" },
      });
    }

    // Database operation
    const result = await pool.query(
      "INSERT INTO owners (name) VALUES ($1) RETURNING *",
      [req.body.name]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    });
  }
});
```

### 2. Validation Helper

```javascript
function validateOwner(data) {
  const errors = [];

  if (!data.name || data.name.length < 3) {
    errors.push("Name must be at least 3 characters");
  }

  if (!/^\d{10}$/.test(data.contact)) {
    errors.push("Contact must be 10 digits");
  }

  if (!isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

## Performance Optimization

### 1. Database Indexing

**Recommended Indexes:**

```sql
-- Frequently searched columns
CREATE INDEX idx_owners_contact ON owners(contact);
CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_transactions_owner ON transactions(owner_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
```

### 2. Connection Pooling

- Pool size: 20 connections
- Reuse connections across requests
- Automatic cleanup of idle connections

### 3. Query Optimization

**Use Pagination:**

```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

const result = await pool.query("SELECT * FROM owners LIMIT $1 OFFSET $2", [
  limit,
  offset,
]);
```

**Use Window Functions:**

```sql
-- Instead of calculating balance in application
SELECT
  *,
  SUM(amount) OVER (PARTITION BY owner_id ORDER BY date) as running_balance
FROM transactions;
```

### 4. Caching Strategy

**Recommended:**

- Cache material list (updated infrequently)
- Cache owner names (for dropdown population)
- Don't cache ledger (changes frequently)

---

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=jobin_agency
PORT=5000
NODE_ENV=development
EOF

# Start server with auto-reload
npm start
```

### 2. Testing

**Manual API Testing:**

```bash
# Test transaction creation
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "material_id": 5,
    "quantity": 100,
    "unit_price": 150
  }'

# Test ledger retrieval
curl http://localhost:5000/api/owners/1/ledger
```

### 3. Database Seeding

**Initial Setup:**

```javascript
// seedMasterData.js
const seedData = async () => {
  // Insert materials
  // Insert owners
  // Insert vehicles
};
```

---

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Validate input** on server side (never trust client)
3. **Use connection pooling** for database operations
4. **Log errors** with context for debugging
5. **Handle async operations** with try-catch
6. **Return consistent response** format
7. **Use HTTP status codes** correctly
8. **Comment complex logic** for maintainability

---

**Document Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Development Team
