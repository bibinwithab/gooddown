// src/pages/LedgerPage.jsx
import { useEffect, useState } from "react";
import { fetchOwners, fetchLedger } from "../api";
import { exportToCsv } from "../utils/exportToCSV";

function LedgerPage() {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOwners = async () => {
      try {
        const res = await fetchOwners();
        setOwners(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadOwners();
  }, []);

  const handleOwnerChange = async (e) => {
    const ownerId = e.target.value;
    setSelectedOwnerId(ownerId);
    setLedger([]);
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await fetchLedger(ownerId);
      setLedger(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings =
    ledger.length > 0 ? ledger[ledger.length - 1].cumulative_earnings : 0;

  // ✅ NEW: Export ledger to Excel/CSV
  const handleExportLedger = () => {
    if (!selectedOwnerId || ledger.length === 0) {
      alert("Select an owner with transactions before exporting");
      return;
    }

    const owner = owners.find(
      (o) => String(o.owner_id) === String(selectedOwnerId)
    );
    const ownerName = owner ? owner.name : "Owner";

    exportToCsv(
      `Ledger_${ownerName.replace(/\s+/g, "_")}`,
      ledger.map((row) => ({
        date_time: new Date(row.transaction_timestamp).toLocaleString(),
        material: row.material_name,
        rate: Number(row.rate_per_unit).toFixed(2),
        vehicle_number: row.vehicle_number,
        quantity: row.quantity,
        amount: Number(row.total_cost).toFixed(2),
        cumulative: Number(row.cumulative_earnings).toFixed(2),
      })),
      [
        { label: "Date & Time", key: "date_time" },
        { label: "Material", key: "material" },
        { label: "Rate", key: "rate" },
        { label: "Vehicle Number", key: "vehicle_number" },
        { label: "Quantity", key: "quantity" },
        { label: "Amount (₹)", key: "amount" },
        { label: "Cumulative Earnings (₹)", key: "cumulative" },
      ]
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Vehicle Owner Ledger</h1>

      <div
        style={{
          background: "white",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "1rem",
          maxWidth: "480px",
        }}
      >
        <label style={{ display: "block", fontWeight: "600" }}>
          Select Owner
        </label>
        <select
          value={selectedOwnerId}
          onChange={handleOwnerChange}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
        >
          <option value="">Choose owner...</option>
          {owners.map((o) => (
            <option key={o.owner_id} value={o.owner_id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading ledger...</p>}

      {ledger.length > 0 && (
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
            <strong>Total Earnings: ₹{Number(totalEarnings).toFixed(2)}</strong>
            {/* ✅ Export button */}
            <button
              onClick={handleExportLedger}
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

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr>
                <th style={thS}>Date & Time</th>
                <th style={thS}>Material</th>
                <th style={thS}>Rate (₹)</th>
                <th style={thS}>Vehicle</th>
                <th style={thS}>Qty</th>
                <th style={thS}>Amount (₹)</th>
                <th style={thS}>Cumulative (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, idx) => (
                <tr key={idx}>
                  <td style={tdS}>
                    {new Date(row.transaction_timestamp).toLocaleString()}
                  </td>
                  <td style={tdS}>{row.material_name}</td>
                  <td style={tdS}>{Number(row.rate_per_unit).toFixed(2)}</td>
                  <td style={tdS}>{row.vehicle_number}</td>
                  <td style={tdS}>{row.quantity}</td>
                  <td style={tdS}>{Number(row.total_cost).toFixed(2)}</td>
                  <td style={tdS}>
                    {Number(row.cumulative_earnings).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedOwnerId && ledger.length === 0 && (
        <p>No transactions for this owner yet.</p>
      )}
    </div>
  );
}

const thS = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "0.4rem",
};
const tdS = {
  borderBottom: "1px solid #f1f5f9",
  padding: "0.4rem",
};

export default LedgerPage;
