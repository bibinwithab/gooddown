# 🗄 Database Design

## Database: PostgreSQL

### Tables Overview

| Table | Purpose |
|------|--------|
| owners | Vehicle owner master |
| materials | Material master |
| transactions | Credit entries |
| owner_payments | Debit entries |
| vehicles | Frequently used vehicles |

---

## owners
```sql
CREATE TABLE owners (
  owner_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
---

## materials
```sql
CREATE TABLE materials (
  material_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_unit NUMERIC(10,2),
  unit TEXT,
  is_active BOOLEAN DEFAULT true
);
```
---

## transactions (Credits)
```sql
CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES owners(owner_id),
  material_id INT REFERENCES materials(material_id),
  vehicle_number TEXT,
  quantity NUMERIC,
  rate_at_sale NUMERIC,
  total_cost NUMERIC,
  transaction_timestamp TIMESTAMP DEFAULT NOW()
);
```
---

## owner_payments (Debits)
```sql
CREATE TABLE owner_payments (
  payment_id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES owners(owner_id),
  amount NUMERIC,
  mode TEXT,
  notes TEXT,
  payment_date TIMESTAMP DEFAULT NOW()
);
```
---

## Ledger Calculation Logic

- Credits → `+amount`
- Debits → `-amount`
- Balance computed using SQL window functions