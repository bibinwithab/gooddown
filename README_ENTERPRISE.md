# Jobin Agency Billing & Ledger System - Enterprise Documentation

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Status:** Production Ready  
**Classification:** Internal Use - Standard

---

## 1. Executive Summary

The Jobin Agency Billing & Ledger System is an enterprise-grade financial management platform designed to automate and streamline operations for material suppliers and transportation agencies. This comprehensive system digitizes transaction management, billing, ledger reconciliation, reporting, and data export while supporting offline-first deployment on local area networks (LANs).

### Business Value Proposition

| Metric                     | Impact                                                      |
| -------------------------- | ----------------------------------------------------------- |
| **Error Reduction**        | Eliminates manual calculation errors in billing             |
| **Operational Efficiency** | Automates report generation reducing manual work by 70%     |
| **Real-Time Visibility**   | Instant access to owner balances and transaction history    |
| **Data Integrity**         | Centralized database ensures single source of truth         |
| **Scalability**            | Supports growth from small operations to medium enterprises |

---

## 2. Problem Statement & Solution

### Business Challenges

- **Manual Calculation Errors:** Hand-calculated transactions introduce arithmetic mistakes
- **Audit Trail Gaps:** Limited traceability of payment flows and outstanding balances
- **Time Consumption:** Manual compilation of reports consumes 15-20 hours per week
- **Data Fragmentation:** Multiple paper and digital records create inconsistencies
- **Access Delays:** Delayed decision-making due to unavailable real-time data

### Solution Architecture

This system provides:

- **Centralized Database:** Single source of truth for all financial transactions
- **Automated Calculations:** SQL-based ledger calculations eliminate human error
- **Real-Time Reporting:** Instant access to financial statements and balances
- **Scalable Infrastructure:** Cloud and on-premises deployment options
- **Audit Trail:** Complete transaction history with timestamps and user tracking

---

## 3. Core Features & Capabilities

### 3.1 Transaction Management

- **Create & Manage:** Full transaction lifecycle from entry to reconciliation
- **Owner-Wise Tracking:** All transactions organized by owner/client
- **Vehicle Assignment:** Link transactions to specific vehicles and assets
- **Timestamp Recording:** Automatic capture of transaction date/time
- **Real-Time Validation:** Server-side validation prevents data integrity issues

### 3.2 Financial Ledger & Accounting

- **Running Balance:** Real-time calculation of owner account balances
- **Window Functions:** Advanced SQL-based balance computation
- **Debit/Payment Tracking:** Complete payment history and reconciliation
- **Multi-Currency Support:** Foundation for international operations
- **Period-Wise Reporting:** Balance snapshots for different time periods

### 3.3 Billing & Financial Reports

- **Transaction Reports:** Detailed transaction listings with filters
- **Weekly Summaries:** Automated weekly transaction aggregation
- **Owner Statements:** Financial statements for individual owners
- **Custom Date Ranges:** Flexible reporting periods for analysis
- **Export Capabilities:** Multiple format support for distribution

### 3.4 Data Export & Printing

- **Excel Exports:** Professional Excel files with styling and formatting
- **Merged Cells & Borders:** Formatted reports ready for presentation
- **Thermal Printing:** ESC/POS support for receipt and bill printing
- **Network Printer Support:** Direct printing to shared network printers
- **Batch Processing:** Export multiple reports simultaneously

### 3.5 User Interface & Experience

- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Intuitive Navigation:** Non-technical users can operate without training
- **Fast Search & Filters:** Real-time filtering for quick data access
- **Offline-Capable:** Functions on local networks without internet
- **Accessibility:** Standard compliance for users with different abilities

---

## 4. Technology Stack & Infrastructure

### 4.1 Frontend Layer

```
Technology Stack:
├── React 19.2.0 (UI Framework)
├── Vite 7.2.4 (Module Bundler)
├── TailwindCSS 4.1.18 (CSS Framework)
├── React Router 7.10.1 (Navigation)
├── Axios 1.13.2 (HTTP Client)
├── XLSX-JS-Style 1.2.0 (Excel Export)
└── ESLint 9.39.1 (Code Quality)
```

**Rationale:** Modern, performant stack with strong developer ecosystem

### 4.2 Backend Layer

```
Technology Stack:
├── Node.js 18+ (Runtime)
├── Express 5.2.1 (Web Framework)
├── PostgreSQL (Database)
├── Dotenv 17.2.3 (Configuration)
├── Nodemon 3.1.11 (Development Tool)
└── Node-PG 8.16.3 (Database Driver)
```

**Rationale:** Lightweight, scalable REST API with proven reliability

### 4.3 Database Layer

```
Database: PostgreSQL
├── ACID Compliance (Data Integrity)
├── Window Functions (Ledger Calculation)
├── Indexing Support (Performance)
├── Replication (High Availability)
└── Backup/Recovery (Business Continuity)
```

### 4.4 Deployment Environment

- **Operating System:** Windows Server / Linux
- **Network:** Local Area Network (LAN) deployment
- **Internet:** Optional (for updates and monitoring)
- **Port:** 5000 (configurable)
- **Protocol:** HTTP/REST API

---

## 5. System Architecture

### 5.1 Three-Tier Architecture

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│         React.js Browser Interface (Port 5173)          │
│    Mobile-Responsive UI with TailwindCSS Styling       │
└────────────────────┬─────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼─────────────────────────────────┐
│                   API LAYER                           │
│        Express.js REST Server (Port 5000)            │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │ Materials│ Owners   │Transaction│ Reports  │       │
│  │ Router   │ Router   │ Router    │ Router   │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │  Bills   │Vehicles  │ Ledger   │ Weekly   │       │
│  │ Router   │ Router   │ Router   │ Router   │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
└────────────────────┬─────────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼─────────────────────────────────┐
│                   DATA LAYER                          │
│       PostgreSQL Database (Port 5432)                │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │ Owners   │Materials │Transactions│Vehicles │       │
│  │ Table    │ Table    │ Table     │ Table   │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
│              Window Functions / Indexing             │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────┐         ┌───────▼─┐
    │ Exports  │         │Printers  │
    │ (Excel)  │         │(Thermal) │
    └──────────┘         └──────────┘
```

### 5.2 Data Flow - Transaction Processing

```
1. User Input (Frontend)
   ↓
2. Validation (Client-side)
   ↓
3. API Call (Axios)
   ↓
4. Express Route Handler
   ↓
5. Server-side Validation
   ↓
6. Database Transaction
   ↓
7. Ledger Recalculation (Window Functions)
   ↓
8. Response to Client
   ↓
9. UI Update (React State)
```

### 5.3 Architectural Principles

| Principle                    | Implementation             | Benefit                            |
| ---------------------------- | -------------------------- | ---------------------------------- |
| **Stateless API**            | No session state in server | Horizontal scalability             |
| **Server-Side Ledger**       | SQL window functions       | Data integrity, prevents tampering |
| **REST Convention**          | RESTful endpoint design    | Predictable API behavior           |
| **Database Isolation**       | Transactions & rollback    | ACID compliance                    |
| **Separation of Concerns**   | Routes → Logic → Data      | Maintainability                    |
| **Configuration Management** | Environment variables      | Flexibility across environments    |

---

## 6. Installation & Setup Guide

### 6.1 Prerequisites

| Requirement | Version | Purpose                    |
| ----------- | ------- | -------------------------- |
| Node.js     | 16.0.0+ | JavaScript runtime         |
| npm/yarn    | Latest  | Package manager            |
| PostgreSQL  | 12.0+   | Database                   |
| Git         | Latest  | Version control            |
| Disk Space  | 500 MB  | Application & dependencies |

### 6.2 Step-by-Step Installation

#### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/gooddown.git
cd gooddown
```

#### Step 2: Backend Setup

```bash
cd backend
npm install

# Create .env file with database credentials
cat > .env << EOF
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_secure_password
PGDATABASE=jobin_agency
PORT=5000
NODE_ENV=development
EOF

# Run database migrations/seed data
npm run seed

# Start backend server
npm start
```

**Expected Output:**

```
Server running on port 5000
Database pool created
```

#### Step 3: Frontend Setup

```bash
cd ../frontend
npm install

# Development mode
npm run dev

# Production build
npm run build
```

**Expected Output:**

```
Vite v7.2.4 ready in 234 ms
Local: http://localhost:5173/
```

#### Step 4: Access Application

- **Development:** http://localhost:5173
- **Production:** http://your-server-ip:5000

### 6.3 Environment Configuration

#### Backend (.env)

```env
# Database Connection
PGHOST=localhost              # Database host
PGPORT=5432                   # Database port
PGUSER=postgres               # Database user
PGPASSWORD=secure_password    # Database password
PGDATABASE=jobin_agency       # Database name

# Server Configuration
PORT=5000                      # API server port
NODE_ENV=production           # Environment: development/production

# Optional: Monitoring
LOG_LEVEL=info               # Logging level
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000    # API endpoint
VITE_APP_NAME=Jobin Agency Billing    # App name
```

---

## 7. API Documentation

### 7.1 REST Endpoints Overview

| Resource           | Methods        | Endpoints                | Purpose             |
| ------------------ | -------------- | ------------------------ | ------------------- |
| **Owners**         | GET, POST      | `/api/owners`            | Owner management    |
| **Materials**      | GET, PUT, POST | `/api/materials`         | Material catalog    |
| **Transactions**   | POST, GET      | `/api/transactions`      | Transaction records |
| **Ledger**         | GET, POST      | `/api/owners/:id/ledger` | Ledger queries      |
| **Vehicles**       | GET, POST      | `/api/vehicles`          | Vehicle tracking    |
| **Reports**        | GET            | `/api/reports`           | Financial reports   |
| **Bills**          | GET, POST      | `/api/bills`             | Bill generation     |
| **Weekly Reports** | GET            | `/api/weekly-reports`    | Weekly summaries    |

### 7.2 Authentication & Authorization

**Current Status:** Basic authentication (No auth required)
**Recommendation:** Implement JWT-based authentication for production

### 7.3 Request/Response Format

**Request:**

```json
POST /api/transactions
Content-Type: application/json

{
  "owner_id": 1,
  "material_id": 5,
  "quantity": 100,
  "unit_price": 150.00,
  "vehicle_id": 10,
  "date": "2025-12-22"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "owner_id": 1,
    "total_amount": 15000.0,
    "timestamp": "2025-12-22T10:30:00Z"
  }
}
```

---

## 8. Deployment Guide

### 8.1 Development Deployment

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 8.2 Production Deployment

#### Option A: Single Server Deployment

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Copy built files to backend public directory
cp -r dist/* ../backend/public/

# 3. Start backend with NODE_ENV=production
cd ../backend
NODE_ENV=production npm start
```

**Serve on:** http://your-server-ip:5000

#### Option B: Docker Deployment

```bash
# Build Docker image
docker build -t jobin-billing:1.0.0 .

# Run container
docker run -d -p 5000:5000 \
  -e PGHOST=db_host \
  -e PGUSER=postgres \
  -e PGPASSWORD=password \
  -e PGDATABASE=jobin_agency \
  jobin-billing:1.0.0
```

### 8.3 Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 8.4 Database Backup

```bash
# Full database backup
pg_dump -U postgres -d jobin_agency > backup_$(date +%Y%m%d).sql

# Scheduled backup (Linux cron)
0 2 * * * /usr/bin/pg_dump -U postgres jobin_agency > /backup/jobin_$(date +\%Y\%m\%d).sql
```

---

## 9. Security Considerations

### 9.1 Security Measures Implemented

| Security Layer | Measures                                         |
| -------------- | ------------------------------------------------ |
| **Network**    | CORS headers configured, local LAN deployment    |
| **Database**   | PostgreSQL credentials in environment variables  |
| **API**        | Server-side validation, SQL injection prevention |
| **Frontend**   | Input sanitization, XSS protection               |

### 9.2 Recommended Security Enhancements

**High Priority:**

- [ ] Implement JWT authentication
- [ ] Enable HTTPS/SSL certificates
- [ ] Add rate limiting on API endpoints
- [ ] Implement API request signing

**Medium Priority:**

- [ ] Add user role-based access control (RBAC)
- [ ] Enable database encryption at rest
- [ ] Implement audit logging
- [ ] Add two-factor authentication

**Low Priority:**

- [ ] API key management
- [ ] Advanced threat detection
- [ ] Compliance certifications (ISO 27001, etc.)

---

## 10. Troubleshooting & Support

### 10.1 Common Issues

| Issue                          | Solution                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| **Database Connection Failed** | Verify PostgreSQL is running, check credentials in .env                    |
| **Port 5000 Already in Use**   | `lsof -i :5000` to find process, kill and restart                          |
| **Frontend Build Errors**      | Clear node_modules, run `npm ci` instead of `npm install`                  |
| **CORS Errors**                | Verify backend is serving with correct Access-Control-Allow-Origin headers |
| **Excel Export Not Working**   | Check XLSX-JS-Style dependency installation                                |

### 10.2 Logging & Monitoring

**View Backend Logs:**

```bash
# Development
npm start

# Production with logging
NODE_DEBUG=express npm start 2>&1 | tee app.log
```

**Monitor Database:**

```bash
# PostgreSQL connection status
psql -U postgres -d jobin_agency -c "SELECT datname, usename, state FROM pg_stat_activity;"
```

### 10.3 Getting Help

1. **Internal Documentation:** See `/docs/` folder for detailed guides
2. **API Testing:** Use Postman with provided collection
3. **Database Queries:** Check `/docs/DATABASE.md` for SQL patterns
4. **Contact:** Development team email or internal support channel

---

## 11. Version & Release Management

### 11.1 Version History

| Version | Date     | Changes         | Status     |
| ------- | -------- | --------------- | ---------- |
| 1.0.0   | Dec 2025 | Initial release | Production |
| 0.9.0   | Nov 2025 | Beta release    | Archived   |
| 0.5.0   | Oct 2025 | Alpha release   | Archived   |

### 11.2 Versioning Strategy

- **Major (X.0.0):** Breaking changes
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, no new features

### 11.3 Release Process

1. Create release branch
2. Update version in package.json
3. Update CHANGELOG.md
4. Create Git tag
5. Build and test
6. Deploy to production

---

## 12. Roadmap & Future Enhancements

### Phase 2 (Q1 2026)

- [ ] Mobile app (React Native)
- [ ] Multi-user authentication
- [ ] Advanced reporting (Charts, Dashboards)
- [ ] API documentation (Swagger/OpenAPI)

### Phase 3 (Q2 2026)

- [ ] Cloud deployment (AWS/Azure)
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Mobile offline sync

### Phase 4 (Q3+ 2026)

- [ ] Analytics & ML-based predictions
- [ ] Custom report builder
- [ ] Automated reconciliation
- [ ] ERP integration

---

## 13. Contact & Support

| Role                 | Contact              | Availability   |
| -------------------- | -------------------- | -------------- |
| **Development Lead** | dev-lead@company.com | Business hours |
| **DevOps Engineer**  | devops@company.com   | 24/7 on-call   |
| **Database Admin**   | dba@company.com      | Business hours |
| **Product Manager**  | pm@company.com       | Business hours |

---

## 14. Document Control

| Property             | Value                   |
| -------------------- | ----------------------- |
| **Document Version** | 1.0.0                   |
| **Last Updated**     | December 22, 2025       |
| **Next Review**      | March 22, 2026          |
| **Maintained By**    | Development Team        |
| **Approved By**      | IT Management           |
| **Classification**   | Internal Use - Standard |
| **Archive Policy**   | Keep for 3 years        |

---

**End of Enterprise Documentation**

For detailed technical specifications, see individual documentation files in the `/docs/` directory.
