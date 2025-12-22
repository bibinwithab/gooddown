# 🏗 System Architecture

## High-Level Architecture

[ Client (Browser / Mobile) ]
          ->
[ React + Vite Frontend ]
          -> REST API
[ Express Backend ]
          ->
[ PostgreSQL Database ]
          ->
[ Thermal Printer / Excel Export ]

## Design Principles
- Stateless backend
- Database-driven ledger
- Separation of concerns
- Offline-first LAN deployment

## Data Flow (Billing)
1. User enters transaction
2. Backend saves transaction rows
3. Ledger computed using SQL window functions
4. Balance calculated server-side

## Why This Architecture?
- Scales horizontally
- Prevents client-side ledger tampering
- Easy reporting & auditing
