// src/App.jsx
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import TransactionPage from "./pages/TransactionPage";
import LedgerPage from "./pages/LedgerPage";
import ReportsPage from "./pages/ReportsPage";
import MasterDataPage from "./pages/MasterDataPage";

function App() {
  return (
    <Router>
      <div
        className="app-container"
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: "220px",
            background: "#1f2933",
            color: "white",
            padding: "1.5rem 1rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
            Jobin Agency Admin
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
  <li style={{ marginBottom: "0.8rem" }}>
    <NavLink 
      to="/" 
      style={({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        background: isActive ? "#4f46e5" : "transparent",
        padding: "6px 10px",
        borderRadius: "4px",
        display: "block"
      })}
    >
      Transaction Entry
    </NavLink>
  </li>

  <li style={{ marginBottom: "0.8rem" }}>
    <NavLink 
      to="/ledger"
      style={({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        background: isActive ? "#4f46e5" : "transparent",
        padding: "6px 10px",
        borderRadius: "4px",
        display: "block"
      })}
    >
      Owner Ledger
    </NavLink>
  </li>

  <li style={{ marginBottom: "0.8rem" }}>
    <NavLink 
      to="/reports"
      style={({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        background: isActive ? "#4f46e5" : "transparent",
        padding: "6px 10px",
        borderRadius: "4px",
        display: "block"
      })}
    >
      Reports
    </NavLink>
  </li>

  <li style={{ marginBottom: "0.8rem" }}>
    <NavLink 
      to="/master-data"
      style={({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        background: isActive ? "#4f46e5" : "transparent",
        padding: "6px 10px",
        borderRadius: "4px",
        display: "block"
      })}
    >
      Master Data
    </NavLink>
  </li>
</ul>

        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: "1.5rem", background: "#f7fafc" }}>
          <Routes>
            <Route path="/" element={<TransactionPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/master-data" element={<MasterDataPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
