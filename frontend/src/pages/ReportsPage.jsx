// src/pages/ReportsPage.jsx
import { useEffect, useState } from "react";
import { fetchOwnerAccountsSummary } from "../api";
import { exportToCsv } from "../utils/exportToCSV";

// Helper: today's date as YYYY-MM-DD (local time)
const todayStr = new Date().toISOString().slice(0, 10);

function ReportsPage() {
  // Default both dates to TODAY → daily report by default
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On first load, fetch default (today) from backend
  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetchOwnerAccountsSummary(
        fromDate || undefined,
        toDate || undefined
      );

      setData(res.data.owners || []);
      setEffectiveFrom(res.data.from);
      setEffectiveTo(res.data.to);
    } catch (err) {
      console.error(err);
      setError("Failed to load owner accounts summary");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadSummary();
  };

  const totalForAllOwners = data.reduce(
    (sum, row) => sum + Number(row.total_payable || 0),
    0
  );

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    exportToCsv(
      `OwnerAccounts_${effectiveFrom}_to_${effectiveTo}`,
      data.map((row) => ({
        owner_name: row.owner_name,
        total_payable: Number(row.total_payable || 0).toFixed(2),
      })),
      [
        { label: "Owner Name", key: "owner_name" },
        { label: "Total Amount (₹)", key: "total_payable" },
      ]
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>
        Owner Accounts – Amount Collectable by Period
      </h1>

      {/* Filter Card */}
      <div
        style={{
          background: "white",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "1rem",
          maxWidth: "520px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "600" }}>
              From (Date)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "600" }}>
              To (Date)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Apply
          </button>
        </form>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.85rem",
            color: "#64748b",
          }}
        >
          Showing for: <strong>{effectiveFrom}</strong> to{" "}
          <strong>{effectiveTo}</strong>
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {loading && <p>Loading owner accounts...</p>}

      {/* Table Card */}
      {!loading && (
        <div
          style={{
            background: "white",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              marginBottom: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Total Owners: </strong> {data.length} &nbsp;|&nbsp;
              <strong>Total Collectable (From All Owners): </strong> ₹
              {totalForAllOwners.toFixed(2)}
            </div>
            <button
              onClick={handleExport}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: "#e5f4ff",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Export to Excel
            </button>
          </div>

          {data.length === 0 ? (
            <p>No data for this period.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thS}>Owner Name</th>
                  <th style={thS}>Amount Collectable (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.owner_id}>
                    <td style={tdS}>{row.owner_name}</td>
                    <td style={tdS}>
                      {Number(row.total_payable || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
};

const thS = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "0.4rem",
};

const tdS = {
  borderBottom: "1px solid #f1f5f9",
  padding: "0.4rem",
};

export default ReportsPage;
