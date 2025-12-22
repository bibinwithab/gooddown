# Frontend Architecture & Implementation Guide

**Document Version:** 1.0.0  
**Last Updated:** December 2025  
**Technology:** React 19 + Vite + TailwindCSS + React Router

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Architecture](#core-architecture)
3. [Components Overview](#components-overview)
4. [Page Structure](#page-structure)
5. [API Integration](#api-integration)
6. [State Management](#state-management)
7. [Styling & Responsive Design](#styling--responsive-design)
8. [Build & Deployment](#build--deployment)
9. [Best Practices](#best-practices)

---

## Project Structure

```
frontend/
├── index.html                  # Entry HTML file
├── main.jsx                    # React app entry point
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # TailwindCSS config
├── eslint.config.js            # ESLint configuration
├── .gitignore                  # Git ignore rules
└── src/
    ├── App.jsx                 # Main app component
    ├── index.css               # Global styles
    ├── api.js                  # API service layer
    ├── components/             # Reusable components
    │   ├── BillTemplate.jsx
    │   └── BillTemplate.css
    ├── pages/                  # Page components
    │   ├── LedgerPage.jsx
    │   ├── TransactionPage.jsx
    │   ├── MasterDataPage.jsx
    │   ├── ReportsPage.jsx
    │   └── WeeklyReportPage.jsx
    └── utils/                  # Utility functions
        ├── exportToCSV.js
        └── exportWeeklyLedgerToExcel.js
```

---

## Core Architecture

### 1. Vite Configuration (vite.config.js)

**Key Features:**

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

**Benefits:**

- Lightning-fast development server
- Hot Module Replacement (HMR)
- Optimized production builds
- API proxy for development

### 2. TailwindCSS Integration

**Configuration (tailwind.config.js):**

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        secondary: "#dc2626",
      },
    },
  },
};
```

**Usage in Components:**

```jsx
<div className="p-4 bg-blue-100 rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
</div>
```

### 3. React Router Setup

**Multi-page Navigation:**

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/ledger/:ownerId" element={<LedgerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Components Overview

### 1. BillTemplate Component

**Purpose:** Display and format bills for printing

**File:** [src/components/BillTemplate.jsx](../../src/components/BillTemplate.jsx)

**Key Features:**

```jsx
function BillTemplate({ transaction, owner, items }) {
  return (
    <div className="bill-container p-8 bg-white border-2 border-gray-300">
      <div className="bill-header">
        <h1 className="text-3xl font-bold">BILL</h1>
        <p className="text-sm text-gray-600">Bill No: {transaction.id}</p>
      </div>

      <div className="bill-details mt-4">
        <p>
          <strong>To:</strong> {owner.name}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(transaction.date)}
        </p>
      </div>

      <table className="bill-items mt-6 w-full">
        <thead>
          <tr className="border-b-2">
            <th className="text-left p-2">Item</th>
            <th className="text-right p-2">Qty</th>
            <th className="text-right p-2">Rate</th>
            <th className="text-right p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2">{item.name}</td>
              <td className="text-right p-2">{item.quantity}</td>
              <td className="text-right p-2">{item.unit_price}</td>
              <td className="text-right p-2">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bill-totals mt-6 text-right">
        <p>
          <strong>Total: ₹{calculateTotal(items)}</strong>
        </p>
      </div>
    </div>
  );
}
```

**Printing:**

```jsx
function handlePrint() {
  window.print(); // Uses CSS media queries for print styling
}
```

**CSS (BillTemplate.css):**

```css
@media print {
  .bill-container {
    width: 100%;
    padding: 0;
    border: none;
  }

  .no-print {
    display: none;
  }

  body {
    margin: 0;
    padding: 0;
  }
}
```

---

## Page Structure

### 1. Transaction Page

**File:** [src/pages/TransactionPage.jsx](../../src/pages/TransactionPage.jsx)

**Flow:**

```
1. Load owners & materials
2. Form input (owner, material, qty, price, vehicle)
3. Validate input
4. POST to /api/transactions
5. Update ledger display
6. Show success/error message
```

**Key State:**

```jsx
const [owners, setOwners] = useState([]);
const [materials, setMaterials] = useState([]);
const [formData, setFormData] = useState({
  owner_id: "",
  material_id: "",
  quantity: 0,
  unit_price: 0,
  vehicle_id: "",
});
const [ledger, setLedger] = useState([]);
const [loading, setLoading] = useState(false);
```

### 2. Ledger Page

**File:** [src/pages/LedgerPage.jsx](../../src/pages/LedgerPage.jsx)

**Features:**

- Owner selection
- Date range filtering
- Running balance display
- Payment recording
- Balance calculation

**Query Parameters:**

```jsx
const { ownerId } = useParams();
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
```

### 3. Master Data Page

**File:** [src/pages/MasterDataPage.jsx](../../src/pages/MasterDataPage.jsx)

**Sections:**

1. **Owners Tab:**

   - List of all owners
   - Add new owner form
   - Edit owner details
   - Contact information

2. **Materials Tab:**

   - Material catalog
   - Add new material
   - Update pricing
   - Category grouping

3. **Vehicles Tab:**
   - Vehicle registration & details
   - Driver information
   - Vehicle capacity
   - Owner assignment

### 4. Reports Page

**File:** [src/pages/ReportsPage.jsx](../../src/pages/ReportsPage.jsx)

**Report Types:**

- Transaction summary
- Owner-wise statements
- Weekly aggregation
- Custom date range reports

**Export Options:**

```jsx
function exportToExcel(reportData) {
  // Generate styled Excel file
  // Include headers, borders, formatting
  // Download as file
}
```

### 5. Weekly Report Page

**File:** [src/pages/WeeklyReportPage.jsx](../../src/pages/WeeklyReportPage.jsx)

**Features:**

- Week selector
- Owner-wise summary
- Transaction count by owner
- Weekly totals
- Export functionality

---

## API Integration

### 1. API Service Layer (api.js)

**Purpose:** Centralize API calls with consistent error handling

```javascript
import axios from "axios";

const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  // Add auth token if needed
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    throw error;
  }
);

// Exported API functions
export const owners = {
  list: () => api.get("/owners"),
  create: (data) => api.post("/owners", data),
  get: (id) => api.get(`/owners/${id}`),
};

export const materials = {
  list: () => api.get("/materials"),
  create: (data) => api.post("/materials", data),
  update: (id, data) => api.put(`/materials/${id}`, data),
};

export const transactions = {
  create: (data) => api.post("/transactions", data),
  list: (params) => api.get("/transactions", { params }),
};

export const ledger = {
  get: (ownerId, params) => api.get(`/owners/${ownerId}/ledger`, { params }),
  recordPayment: (ownerId, data) =>
    api.post(`/owners/${ownerId}/payments`, data),
};

export const vehicles = {
  list: (params) => api.get("/vehicles", { params }),
  create: (data) => api.post("/vehicles", data),
};

export const reports = {
  getTransactions: (params) => api.get("/reports/transactions", { params }),
  getSummary: () => api.get("/reports/summary"),
  getWeekly: (params) => api.get("/reports/weekly", { params }),
};
```

### 2. Usage in Components

**Fetch Data on Mount:**

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await owners.list();
      setOwners(data.data);
    } catch (error) {
      setError("Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

**Submit Form Data:**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await transactions.create({
      owner_id: formData.owner_id,
      material_id: formData.material_id,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      vehicle_id: formData.vehicle_id,
      date: new Date().toISOString().split("T")[0],
    });

    setSuccess("Transaction created successfully");
    setFormData({}); // Reset form
    loadLedger(); // Refresh ledger
  } catch (error) {
    setError(
      error.response?.data?.error?.message || "Error creating transaction"
    );
  }
};
```

---

## State Management

### 1. Local Component State

**Simple Data:**

```jsx
const [count, setCount] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

**Form State:**

```jsx
const [formData, setFormData] = useState({
  name: "",
  email: "",
  contact: "",
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};
```

### 2. Context for Shared State (Recommended for Future)

```jsx
// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  return (
    <AppContext.Provider value={{ user, permissions }}>
      {children}
    </AppContext.Provider>
  );
}

// Usage in component
const { user, permissions } = useContext(AppContext);
```

---

## Styling & Responsive Design

### 1. TailwindCSS Classes

**Common Patterns:**

```jsx
// Responsive layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>

// Flex layout
<div className="flex justify-between items-center p-4">
  <h1 className="text-2xl font-bold">Title</h1>
  <button className="px-4 py-2 bg-blue-500 text-white rounded">Action</button>
</div>

// Card component
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Heading</h1>
```

### 2. Global Styles (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: #f9fafb;
}

.container {
  @apply max-w-7xl mx-auto px-4;
}

/* Print styles */
@media print {
  .no-print {
    display: none;
  }

  .print-only {
    display: block;
  }
}
```

### 3. Component Specific Styles

**CSS Modules Pattern:**

```jsx
// BillTemplate.jsx
import styles from "./BillTemplate.module.css";

export function BillTemplate() {
  return <div className={styles.billContainer}>{/* Content */}</div>;
}
```

---

## Build & Deployment

### 1. Development Server

```bash
# Start dev server
npm run dev

# Access at http://localhost:5173
# Auto-reloads on file changes (HMR)
```

### 2. Production Build

```bash
# Create optimized build
npm run build

# Output: dist/ folder
# - Minified JS/CSS
# - Image optimization
# - Code splitting

# Preview production build
npm run preview
```

### 3. Build Output Structure

```
dist/
├── index.html          # Entry file
├── assets/
│   ├── index-HASH.js   # Main bundle
│   ├── index-HASH.css  # Global styles
│   └── vendor-HASH.js  # Node modules
```

### 4. Environment Variables

**.env.development:**

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Jobin Agency Billing
```

**.env.production:**

```env
VITE_API_URL=http://your-domain.com/api
VITE_APP_NAME=Jobin Agency Billing
```

---

## Best Practices

### 1. Component Design

**Functional Components:**

```jsx
function MyComponent({ prop1, prop2 }) {
  return (
    <div>
      {prop1} - {prop2}
    </div>
  );
}
```

**Props Validation:**

```jsx
import PropTypes from "prop-types";

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object),
  onSubmit: PropTypes.func,
};

MyComponent.defaultProps = {
  items: [],
  onSubmit: () => {},
};
```

### 2. Error Handling

```jsx
function DataFetcher() {
  const [error, setError] = useState(null);

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        <p>Error: {error}</p>
      </div>
    );
  }

  return <div>{/* Content */}</div>;
}
```

### 3. Loading States

```jsx
function DataList() {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return <div>{/* Content */}</div>;
}
```

### 4. Form Validation

```jsx
function validateForm(data) {
  const errors = {};

  if (!data.name) errors.name = "Name is required";
  if (!/^\d{10}$/.test(data.contact)) errors.contact = "Invalid contact";
  if (!data.email.includes("@")) errors.email = "Invalid email";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

---

## Performance Optimization

### 1. Code Splitting

**Lazy Load Pages:**

```jsx
import { lazy, Suspense } from 'react'

const TransactionPage = lazy(() => import('./pages/TransactionPage'))

<Suspense fallback={<Loading />}>
  <TransactionPage />
</Suspense>
```

### 2. Memoization

```jsx
// Prevent unnecessary re-renders
import { memo } from "react";

const OwnerList = memo(({ owners }) => {
  return owners.map((o) => <OwnerItem key={o.id} owner={o} />);
});

// Memoize expensive calculations
import { useMemo } from "react";

const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.amount, 0);
}, [items]);
```

### 3. Image Optimization

```jsx
// Use optimized images
<img
  src="/images/logo.webp"
  alt="Logo"
  loading="lazy"
  width={100}
  height={100}
/>
```

---

**Document Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Maintained By:** Frontend Development Team
