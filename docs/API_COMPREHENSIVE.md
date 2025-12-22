# Complete API Reference

**Document Version:** 1.0.0  
**Last Updated:** December 2025  
**API Base URL:** `http://localhost:5000/api`

---

## Table of Contents

1. [Owners Management](#owners-management)
2. [Materials Management](#materials-management)
3. [Transactions](#transactions)
4. [Ledger & Payments](#ledger--payments)
5. [Vehicles](#vehicles)
6. [Reports](#reports)
7. [Bills](#bills)
8. [Weekly Reports](#weekly-reports)
9. [Response Codes](#response-codes)
10. [Error Handling](#error-handling)

---

## Owners Management

### Get All Owners

**Endpoint:** `GET /api/owners`

**Description:** Retrieve list of all registered owners/clients

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Records per page (default: 20) |
| search | string | No | Search owner by name or ID |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Owner A",
      "contact": "9876543210",
      "email": "owner@example.com",
      "address": "123 Main St",
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-22T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/owners?page=1&limit=20"
```

---

### Create New Owner

**Endpoint:** `POST /api/owners`

**Description:** Register a new owner/client in the system

**Request Body:**

```json
{
  "name": "New Owner",
  "contact": "9876543210",
  "email": "owner@example.com",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

**Validation Rules:**

- `name`: Required, min 3 characters, max 100 characters
- `contact`: Required, 10 digits, unique
- `email`: Valid email format
- `address`: Required, min 5 characters

**Response:**

```json
{
  "success": true,
  "message": "Owner created successfully",
  "data": {
    "id": 46,
    "name": "New Owner",
    "contact": "9876543210",
    "created_at": "2025-12-22T16:00:00Z"
  }
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/owners" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Owner",
    "contact": "9876543210",
    "email": "owner@example.com",
    "address": "123 Main St"
  }'
```

---

## Materials Management

### Get All Materials

**Endpoint:** `GET /api/materials`

**Description:** Retrieve list of all materials in inventory

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| active | boolean | No | Filter active/inactive materials |
| category | string | No | Filter by material category |
| search | string | No | Search by name or code |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cement 50kg",
      "code": "MAT001",
      "category": "Building Materials",
      "unit": "Bag",
      "unit_price": 350.0,
      "description": "Portland cement 50kg bags",
      "active": true,
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

### Update Material

**Endpoint:** `PUT /api/materials/:id`

**Description:** Update material details and pricing

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Material ID |

**Request Body:**

```json
{
  "name": "Cement 50kg - Updated",
  "unit_price": 360.0,
  "active": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Material updated successfully",
  "data": {
    "id": 1,
    "name": "Cement 50kg - Updated",
    "unit_price": 360.0
  }
}
```

---

### Create Material

**Endpoint:** `POST /api/materials`

**Description:** Add new material to inventory

**Request Body:**

```json
{
  "name": "Steel Rods 10mm",
  "code": "MAT002",
  "category": "Structural Materials",
  "unit": "Kg",
  "unit_price": 45.0,
  "description": "High-strength steel rods",
  "active": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Material created successfully",
  "data": {
    "id": 2,
    "name": "Steel Rods 10mm",
    "unit_price": 45.0
  }
}
```

---

## Transactions

### Create Transaction

**Endpoint:** `POST /api/transactions`

**Description:** Record a new transaction (sale)

**Request Body:**

```json
{
  "owner_id": 1,
  "material_id": 5,
  "quantity": 100,
  "unit_price": 150.0,
  "vehicle_id": 10,
  "date": "2025-12-22",
  "notes": "Delivery to site A"
}
```

**Validation Rules:**

- `owner_id`: Must exist in owners table
- `material_id`: Must exist in materials table
- `quantity`: Must be positive number
- `unit_price`: Must be positive number
- `date`: Valid date format (YYYY-MM-DD)

**Calculated Fields:**

- `total_amount`: quantity × unit_price (calculated server-side)

**Response:**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": 1001,
    "owner_id": 1,
    "material_id": 5,
    "quantity": 100,
    "unit_price": 150.0,
    "total_amount": 15000.0,
    "balance_after": -15000.0,
    "created_at": "2025-12-22T16:30:00Z"
  }
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:5000/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": 1,
    "material_id": 5,
    "quantity": 100,
    "unit_price": 150.00,
    "vehicle_id": 10,
    "date": "2025-12-22"
  }'
```

---

### Get Transactions

**Endpoint:** `GET /api/transactions`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| owner_id | integer | Filter by owner |
| start_date | string | Start date (YYYY-MM-DD) |
| end_date | string | End date (YYYY-MM-DD) |
| page | integer | Page number |
| limit | integer | Records per page |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "owner_id": 1,
      "owner_name": "Owner A",
      "material_id": 5,
      "material_name": "Cement 50kg",
      "quantity": 100,
      "unit_price": 150.0,
      "total_amount": 15000.0,
      "vehicle_id": 10,
      "date": "2025-12-22",
      "created_at": "2025-12-22T16:30:00Z"
    }
  ]
}
```

---

## Ledger & Payments

### Get Owner Ledger

**Endpoint:** `GET /api/owners/:ownerId/ledger`

**Description:** Retrieve complete ledger for an owner with running balance

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| ownerId | integer | Owner ID |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | string | Start date (YYYY-MM-DD) |
| end_date | string | End date (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "data": {
    "owner_id": 1,
    "owner_name": "Owner A",
    "current_balance": 5000.0,
    "total_credit": 50000.0,
    "total_debit": 45000.0,
    "transactions": [
      {
        "id": 1001,
        "date": "2025-12-20",
        "type": "CREDIT",
        "amount": 15000.0,
        "description": "Sale - Cement 100 bags",
        "running_balance": -15000.0
      },
      {
        "id": 2001,
        "date": "2025-12-21",
        "type": "DEBIT",
        "amount": 10000.0,
        "description": "Payment received",
        "running_balance": -5000.0
      },
      {
        "id": 1002,
        "date": "2025-12-22",
        "type": "CREDIT",
        "amount": 10000.0,
        "description": "Sale - Steel Rods",
        "running_balance": 5000.0
      }
    ]
  }
}
```

---

### Record Payment

**Endpoint:** `POST /api/owners/:ownerId/payments`

**Description:** Record a payment from owner (reduces balance)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| ownerId | integer | Owner ID |

**Request Body:**

```json
{
  "amount": 5000.0,
  "payment_date": "2025-12-22",
  "payment_method": "Cash",
  "reference": "CHK-12345",
  "notes": "Partial payment against invoice"
}
```

**Validation Rules:**

- `amount`: Must be positive, cannot exceed outstanding balance
- `payment_method`: Cash, Check, Transfer, Card
- `payment_date`: Valid date format

**Response:**

```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment_id": 2002,
    "owner_id": 1,
    "amount": 5000.0,
    "new_balance": 0.0,
    "created_at": "2025-12-22T17:00:00Z"
  }
}
```

---

## Vehicles

### Get Vehicles

**Endpoint:** `GET /api/vehicles`

**Description:** Retrieve list of vehicles with optional filtering

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| owner_id | integer | Filter by owner |
| q | string | Search vehicle by name or registration |
| active | boolean | Filter active/inactive vehicles |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "registration": "MH01AB1234",
      "owner_id": 1,
      "owner_name": "Owner A",
      "vehicle_type": "Truck",
      "capacity_tons": 10,
      "driver_name": "John Doe",
      "contact": "9876543210",
      "active": true,
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

---

### Create Vehicle

**Endpoint:** `POST /api/vehicles`

**Description:** Add new vehicle to the system

**Request Body:**

```json
{
  "registration": "MH01AB1234",
  "owner_id": 1,
  "vehicle_type": "Truck",
  "capacity_tons": 10,
  "driver_name": "John Doe",
  "contact": "9876543210",
  "remarks": "Main delivery vehicle"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "id": 11,
    "registration": "MH01AB1234",
    "owner_id": 1
  }
}
```

---

## Reports

### Get Transaction Reports

**Endpoint:** `GET /api/reports/transactions`

**Description:** Generate detailed transaction report with filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| owner_id | integer | Filter by owner |
| start_date | string | Start date (YYYY-MM-DD) |
| end_date | string | End date (YYYY-MM-DD) |
| format | string | csv, json, xlsx |

**Response (JSON):**

```json
{
  "success": true,
  "report": {
    "title": "Transaction Report",
    "period": "2025-12-20 to 2025-12-22",
    "total_transactions": 5,
    "total_amount": 35000.00,
    "transactions": [...]
  }
}
```

**Example Request (Export as Excel):**

```bash
curl -X GET "http://localhost:5000/api/reports/transactions?start_date=2025-12-01&end_date=2025-12-31&format=xlsx" \
  -o transaction_report.xlsx
```

---

### Get Financial Summary

**Endpoint:** `GET /api/reports/summary`

**Description:** Get summary of all owner balances and financial metrics

**Response:**

```json
{
  "success": true,
  "data": {
    "total_owners": 45,
    "total_outstanding": 125000.0,
    "total_paid": 250000.0,
    "total_transactions": 890,
    "summary_by_owner": [
      {
        "owner_id": 1,
        "owner_name": "Owner A",
        "outstanding": 15000.0,
        "transactions": 12
      }
    ]
  }
}
```

---

## Bills

### Generate Bill

**Endpoint:** `GET /api/bills/:billId`

**Description:** Retrieve formatted bill for printing

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| billId | integer | Bill/Transaction ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "bill_number": "BILL-2025-001",
    "owner_name": "Owner A",
    "items": [
      {
        "material_name": "Cement 50kg",
        "quantity": 100,
        "unit_price": 150.0,
        "total": 15000.0
      }
    ],
    "subtotal": 15000.0,
    "tax": 2700.0,
    "total": 17700.0,
    "date": "2025-12-22"
  }
}
```

---

### Print Bill

**Endpoint:** `POST /api/bills/:billId/print`

**Description:** Send bill to thermal printer

**Request Body:**

```json
{
  "printer_name": "Thermal_Printer_1",
  "copies": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bill sent to printer successfully"
}
```

---

## Weekly Reports

### Get Weekly Summary

**Endpoint:** `GET /api/weekly-reports`

**Description:** Get transaction summary for a week

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| week | string | Week identifier (YYYY-W##) |
| year | integer | Year for report |

**Response:**

```json
{
  "success": true,
  "data": {
    "week": "Week 51, 2025",
    "start_date": "2025-12-15",
    "end_date": "2025-12-21",
    "total_transactions": 23,
    "total_amount": 45000.0,
    "owner_summaries": [
      {
        "owner_id": 1,
        "owner_name": "Owner A",
        "transactions": 5,
        "amount": 12000.0
      }
    ]
  }
}
```

---

## Response Codes

| Code | Meaning              | Description                    |
| ---- | -------------------- | ------------------------------ |
| 200  | OK                   | Request succeeded              |
| 201  | Created              | Resource created successfully  |
| 400  | Bad Request          | Invalid request parameters     |
| 401  | Unauthorized         | Authentication required        |
| 403  | Forbidden            | Access denied                  |
| 404  | Not Found            | Resource not found             |
| 409  | Conflict             | Resource already exists        |
| 422  | Unprocessable Entity | Validation error               |
| 500  | Server Error         | Internal server error          |
| 503  | Service Unavailable  | Server temporarily unavailable |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "owner_id",
        "message": "Owner ID does not exist"
      }
    ]
  }
}
```

### Common Error Codes

| Code              | HTTP | Description               |
| ----------------- | ---- | ------------------------- |
| VALIDATION_ERROR  | 422  | Request validation failed |
| NOT_FOUND         | 404  | Resource not found        |
| UNAUTHORIZED      | 401  | Authentication required   |
| DUPLICATE_ENTRY   | 409  | Resource already exists   |
| DATABASE_ERROR    | 500  | Database operation failed |
| INVALID_OPERATION | 400  | Operation not allowed     |

---

## API Best Practices

### Rate Limiting

- Currently: No rate limiting
- Recommended: 1000 requests per hour per IP

### Pagination

- Default page size: 20
- Maximum page size: 100
- Always check `pagination.total` for total record count

### Date Format

- Always use ISO 8601 format: `YYYY-MM-DD`
- Timestamps include timezone: `YYYY-MM-DDTHH:mm:ssZ`

### Error Handling

- Always check `success` flag
- Read error details from `error` object
- Log errors with request ID for debugging

---

**Document Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Development Team
