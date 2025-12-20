import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import { useState } from "react";
import TransactionPage from "./pages/TransactionPage";
import LedgerPage from "./pages/LedgerPage";
import ReportsPage from "./pages/ReportsPage";
import MasterDataPage from "./pages/MasterDataPage";
import WeeklyReportPage from "./pages/WeeklyReportPage";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `
    block px-3 py-2 rounded
    text-white text-sm
    ${isActive ? "bg-indigo-600" : "hover:bg-slate-700"}
  `;

  return (
    <Router>
      <div className="min-h-screen flex bg-slate-100 overflow-x-hidden">
        {/* Sidebar */}
        <aside
          className={`
    fixed md:static z-40
    w-56
    min-h-screen
    bg-[#1f2933] text-white
    flex flex-col
    transform transition-transform duration-200
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
        >
          <div className="p-4 flex items-center gap-3">
            <span className="text-lg font-semibold">Jobin Agency Admin</span>
          </div>

          <nav className="px-3 space-y-1 flex-1">
            <NavLink
              to="/"
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              Transaction Entry
            </NavLink>
            <NavLink
              to="/ledger"
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              Customer Ledger
            </NavLink>
            <NavLink
              to="/reports"
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              Reports
            </NavLink>
            <NavLink
              to="/master-data"
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              Master Data
            </NavLink>
            <NavLink
              to="/weekly-reports"
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              Weekly Ledger
            </NavLink>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col w-full">
          {/* Mobile header */}
          <header className="md:hidden bg-white shadow px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl text-slate-700"
            >
              ☰
            </button>
            <NavLink
              to="/"
              className="flex items-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <img src="/jobin.png" alt="Jobin" className="h-8 w-8" />
              <span className="font-semibold">Jobin Agencies</span>
            </NavLink>
          </header>

          <main className="flex-1 p-4 max-w-full">
            <Routes>
              <Route path="/" element={<TransactionPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/weekly-reports" element={<WeeklyReportPage />} />
              <Route path="/master-data" element={<MasterDataPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
