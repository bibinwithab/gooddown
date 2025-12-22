# Database Schema & Specifications

**Document Version:** 1.0.0  
**Last Updated:** December 2025  
**Database:** PostgreSQL 12+

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Table Definitions](#table-definitions)
3. [Relationships & Constraints](#relationships--constraints)
4. [Indexes & Performance](#indexes--performance)
5. [Queries & Operations](#queries--operations)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)

---

## Schema Overview

### Database Structure

```
┌──────────────────┐
│     owners       │
├──────────────────┤
│ id (PK)          │
│ name             │
│ contact          │
│ email            │
│ address          │
│ created_at       │
│ updated_at       │
└──────┬───────────┘
       │
       ├──────────────────────────────┬─────────────────────┐
       │                              │                     │
       ▼                              ▼                     ▼
┌──────────────────┐     ┌──────────────────┐  ┌──────────────────┐
│  transactions    │     │    vehicles      │  │    payments      │
├──────────────────┤     ├──────────────────┤  ├──────────────────┤
│ id (PK)          │     │ id (PK)          │  │ id (PK)          │
│ owner_id (FK)    │     │ owner_id (FK)    │  │ owner_id (FK)    │
│ material_id (FK) │     │ registration     │  │ amount           │
│ quantity         │     │ driver_name      │  │ payment_date     │
│ unit_price       │     │ contact          │  │ payment_method   │
│ vehicle_id (FK)  │     │ active           │  │ created_at       │
│ date             │     │ created_at       │  │ updated_at       │
│ created_at       │     │ updated_at       │  └──────────────────┘
│ updated_at       │     └──────────────────┘
└──────┬───────────┘
       │
       └────────────────────────────────┐
                                        │
                                        ▼
                            ┌──────────────────┐
                            │   materials      │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ name             │
                            │ code             │
                            │ category         │
                            │ unit             │
                            │ unit_price       │
                            │ active           │
                            │ created_at       │
                            │ updated_at       │
                            └──────────────────┘
```

---

## Table Definitions

### 1. Owners Table

**Purpose:** Store client/owner information

```sql
CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  contact VARCHAR(10) NOT NULL UNIQUE,
  email VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints:**

- `id`: Auto-increment primary key
- `name`: Unique, required
- `contact`: 10-digit unique phone number
- `email`: Valid email format (optional)

**Indexes:**

```sql
CREATE INDEX idx_owners_contact ON owners(contact);
CREATE INDEX idx_owners_name ON owners(name);
```

---

### 2. Materials Table

**Purpose:** Maintain material catalog and pricing

```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  category VARCHAR(50),
  unit VARCHAR(20),
  unit_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints:**

- `id`: Auto-increment primary key
- `name`: Required, not unique (same material can have variations)
- `code`: Unique material code
- `unit_price`: Decimal for currency
- `active`: Boolean flag for active/inactive

**Indexes:**

```sql
CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_materials_category ON materials(category);
```

---

### 3. Transactions Table

**Purpose:** Record all billing transactions

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (unit_price > 0)
);
```

**Computed Field:**

```
total_amount = quantity × unit_price
```

**Indexes:**

```sql
CREATE INDEX idx_transactions_owner ON transactions(owner_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_material ON transactions(material_id);
```

**Sample Data:**

```
| id  | owner_id | material_id | quantity | unit_price | total_amount | date       |
|-----|----------|-------------|----------|-----------|--------------|------------|
| 1   | 1        | 5           | 100      | 150.00    | 15000.00     | 2025-12-20 |
| 2   | 2        | 3           | 50       | 200.00    | 10000.00     | 2025-12-21 |
| 3   | 1        | 7           | 75       | 120.00    | 9000.00      | 2025-12-22 |
```

---

### 4. Vehicles Table

**Purpose:** Track transportation assets and availability

```sql
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  registration VARCHAR(20) UNIQUE NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50),
  capacity_tons DECIMAL(8, 2),
  driver_name VARCHAR(100),
  contact VARCHAR(10),
  remarks TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints:**

- `registration`: Unique vehicle registration number
- `owner_id`: Foreign key to owners
- `capacity_tons`: Numeric for vehicle capacity

**Indexes:**

```sql
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
```

---

### 5. Payments Table

**Purpose:** Record owner payments and reconciliation

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20),
  reference VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);
```

**Payment Methods:**

- Cash
- Check
- Bank Transfer
- Card

**Indexes:**

```sql
CREATE INDEX idx_payments_owner ON payments(owner_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

## Relationships & Constraints

### Primary & Foreign Keys

| Table        | Column      | References   | Type                   |
| ------------ | ----------- | ------------ | ---------------------- |
| transactions | owner_id    | owners.id    | Foreign Key            |
| transactions | material_id | materials.id | Foreign Key            |
| transactions | vehicle_id  | vehicles.id  | Foreign Key (nullable) |
| vehicles     | owner_id    | owners.id    | Foreign Key            |
| payments     | owner_id    | owners.id    | Foreign Key            |

### Cascade Actions

```sql
-- Delete owner cascades to:
-- - All transactions for that owner
-- - All vehicles assigned to that owner
-- - All payments from that owner

ON DELETE CASCADE
```

### Referential Integrity

```sql
-- Cannot add transaction without valid owner
ALTER TABLE transactions
ADD CONSTRAINT fk_owner_check
CHECK (owner_id IN (SELECT id FROM owners));

-- Cannot add vehicle without valid owner
ALTER TABLE vehicles
ADD CONSTRAINT fk_owner_vehicle_check
CHECK (owner_id IN (SELECT id FROM owners));
```

---

## Indexes & Performance

### 1. Primary Indexes (Auto-created)

```sql
-- Each table has implicit primary key index
CREATE INDEX pk_owners ON owners(id);
CREATE INDEX pk_materials ON materials(id);
```

### 2. Foreign Key Indexes

```sql
-- Speed up joins
CREATE INDEX idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX idx_transactions_material_id ON transactions(material_id);
CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX idx_payments_owner_id ON payments(owner_id);
```

### 3. Search & Filter Indexes

```sql
-- Frequently searched columns
CREATE INDEX idx_owners_contact ON owners(contact);
CREATE INDEX idx_materials_code ON materials(code);
CREATE INDEX idx_vehicles_registration ON vehicles(registration);
```

### 4. Date Range Indexes

```sql
-- For date range queries
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

### 5. Composite Indexes

```sql
-- Multi-column searches
CREATE INDEX idx_transactions_owner_date
ON transactions(owner_id, date DESC);

-- For ledger queries
CREATE INDEX idx_transactions_owner_date_id
ON transactions(owner_id, date, id);
```

### Verify Indexes

```sql
-- List all indexes
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public';

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE owner_id = 1
ORDER BY date DESC;
```

---

## Queries & Operations

### 1. Owner Ledger with Running Balance

```sql
-- Get complete ledger for an owner with running balance
SELECT
  t.id,
  t.date,
  'CREDIT' as transaction_type,
  t.quantity,
  t.unit_price,
  t.quantity * t.unit_price as amount,
  m.name as material_name,
  SUM(t.quantity * t.unit_price) OVER (
    PARTITION BY t.owner_id
    ORDER BY t.date, t.id
  ) as running_balance
FROM transactions t
JOIN materials m ON t.material_id = m.id
WHERE t.owner_id = $1
UNION ALL
SELECT
  p.id,
  p.payment_date,
  'DEBIT' as transaction_type,
  1 as quantity,
  NULL as unit_price,
  -p.amount as amount,
  'Payment Received' as material_name,
  SUM(-p.amount) OVER (
    PARTITION BY p.owner_id
    ORDER BY p.payment_date, p.id
  ) as running_balance
FROM payments p
WHERE p.owner_id = $1
ORDER BY date, id;
```

### 2. Current Balance for Owner

```sql
-- Calculate current outstanding balance
SELECT
  o.id,
  o.name,
  COALESCE(
    SUM(CASE
      WHEN t.id IS NOT NULL
      THEN t.quantity * t.unit_price
      ELSE 0
    END) -
    SUM(COALESCE(p.amount, 0)),
    0
  ) as outstanding_balance
FROM owners o
LEFT JOIN transactions t ON o.id = t.owner_id
LEFT JOIN payments p ON o.id = p.owner_id
GROUP BY o.id, o.name
ORDER BY outstanding_balance DESC;
```

### 3. Weekly Summary

```sql
-- Weekly transaction summary by owner
SELECT
  DATE_TRUNC('week', t.date) as week_start,
  DATE_TRUNC('week', t.date)::date + 6 as week_end,
  o.id as owner_id,
  o.name as owner_name,
  COUNT(t.id) as transaction_count,
  SUM(t.quantity * t.unit_price) as weekly_total
FROM transactions t
JOIN owners o ON t.owner_id = o.id
WHERE t.date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY
  DATE_TRUNC('week', t.date),
  o.id,
  o.name
ORDER BY week_start DESC, owner_name;
```

### 4. Material-wise Sales Report

```sql
-- Sales by material for a period
SELECT
  m.id,
  m.name,
  m.code,
  COUNT(t.id) as transaction_count,
  SUM(t.quantity) as total_quantity,
  SUM(t.quantity * t.unit_price) as total_value,
  AVG(t.unit_price) as avg_price
FROM materials m
LEFT JOIN transactions t ON m.id = t.material_id
WHERE t.date BETWEEN $1 AND $2
GROUP BY m.id, m.name, m.code
ORDER BY total_value DESC;
```

### 5. Outstanding Balances Report

```sql
-- List all owners with outstanding amounts
SELECT
  o.id,
  o.name,
  o.contact,
  COUNT(DISTINCT t.id) as transactions,
  SUM(t.quantity * t.unit_price) - COALESCE(SUM(p.amount), 0) as outstanding
FROM owners o
LEFT JOIN transactions t ON o.id = t.owner_id
LEFT JOIN payments p ON o.id = p.owner_id
GROUP BY o.id, o.name, o.contact
HAVING SUM(t.quantity * t.unit_price) - COALESCE(SUM(p.amount), 0) > 0
ORDER BY outstanding DESC;
```

---

## Backup & Recovery

### 1. Full Database Backup

```bash
# Backup to SQL file
pg_dump -U postgres -d jobin_agency > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup to custom format (faster)
pg_dump -U postgres -d jobin_agency -Fc > backup_$(date +%Y%m%d).dump

# Compress backup
pg_dump -U postgres -d jobin_agency | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 2. Scheduled Backups (Linux Cron)

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/bin/pg_dump -U postgres jobin_agency | gzip > /backup/jobin_$(date +\%Y\%m\%d).sql.gz

# Weekly full backup on Sundays
0 3 * * 0 /usr/bin/pg_dump -U postgres -Fc jobin_agency > /backup/weekly_$(date +\%Y\%m\%d).dump
```

### 3. Restore from Backup

```bash
# From SQL file
psql -U postgres -d jobin_agency < backup_20251222.sql

# From compressed file
gunzip < backup_20251222.sql.gz | psql -U postgres -d jobin_agency

# From custom format
pg_restore -U postgres -d jobin_agency backup_20251222.dump
```

### 4. Backup Verification

```bash
# Check backup file size
ls -lh backup_20251222.sql.gz

# Verify SQL backup integrity
gunzip < backup_20251222.sql.gz | head -100

# Test restore to temporary database
createdb test_jobin
pg_restore -U postgres -d test_jobin backup_20251222.dump
dropdb test_jobin
```

---

## Troubleshooting

### 1. Connection Issues

**Problem:** Cannot connect to PostgreSQL

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d jobin_agency -c "SELECT 1"

# Check connection logs
tail -f /var/log/postgresql/postgresql.log
```

### 2. Slow Queries

**Problem:** Queries running slowly

```sql
-- Find slow queries
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE owner_id = 1
ORDER BY date DESC;

-- Check for missing indexes
SELECT * FROM pg_stat_user_indexes;

-- Analyze table stats
ANALYZE transactions;
```

### 3. Disk Space Issues

```sql
-- Check database size
SELECT
  datname as database,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Check table sizes
SELECT
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 4. Lock Issues

```sql
-- Find locked tables
SELECT
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by
FROM pg_stat_activity
WHERE pg_blocking_pids(pid)::text != '{}';

-- Kill blocking process
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = <pid_number>;
```

### 5. Data Integrity

```sql
-- Find orphaned transactions (owner doesn't exist)
SELECT t.* FROM transactions t
LEFT JOIN owners o ON t.owner_id = o.id
WHERE o.id IS NULL;

-- Fix: Delete orphaned records
DELETE FROM transactions
WHERE owner_id NOT IN (SELECT id FROM owners);

-- Verify referential integrity
SELECT * FROM transactions
WHERE owner_id NOT IN (SELECT id FROM owners)
   OR material_id NOT IN (SELECT id FROM materials);
```

---

## Database Maintenance

### 1. Routine Maintenance

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE;

-- Reindex tables
REINDEX TABLE transactions;
REINDEX TABLE owners;

-- Update table statistics
ANALYZE transactions;
```

### 2. Monitor Database Health

```bash
# Check disk usage
du -sh /var/lib/postgresql/

# Monitor connections
psql -U postgres -d jobin_agency -c "SELECT count(*) FROM pg_stat_activity;"

# Check active queries
SELECT pid, usename, query, state FROM pg_stat_activity WHERE state != 'idle';
```

---

**Document Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Database Administration Team
