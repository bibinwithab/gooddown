// src/pages/LedgerPage.jsx
import { useEffect, useState } from "react";
import { fetchOwners, fetchPaymentLedger, createPayment } from "../api";
import { exportToCsv } from "../utils/exportToCSV";

function LedgerPage() {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  // payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [savingPayment, setSavingPayment] = useState(false);

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

  const loadLedger = async (ownerId) => {
    if (!ownerId) return;
    setLoading(true);
    setLedger([]);
    try {
      const res = await fetchPaymentLedger(ownerId);
      setLedger(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerChange = async (e) => {
    const ownerId = e.target.value;
    setSelectedOwnerId(ownerId);
    setLedger([]);
    if (!ownerId) return;
    await loadLedger(ownerId);
  };

  const latestBalance =
    ledger.length > 0 ? Number(ledger[ledger.length - 1].balance || 0) : 0;

  // Record a payment (DEBIT)
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOwnerId) {
      alert("Select an owner first");
      return;
    }
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      alert("Enter a valid payment amount");
      return;
    }

    try {
      setSavingPayment(true);
      await createPayment(selectedOwnerId, {
        amount: amt,
        mode: paymentMode,
        notes: paymentNote,
      });

      // Clear form
      setPaymentAmount("");
      setPaymentNote("");

      // Reload ledger to include new debit + updated balance
      await loadLedger(selectedOwnerId);
    } catch (err) {
      console.error(err);
      alert("Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  // Export ledger to Excel (XLSX via exportToCsv)
  const handleExportLedger = () => {
    if (!selectedOwnerId || ledger.length === 0) {
      alert("Select an owner with entries before exporting");
      return;
    }

    const owner = owners.find(
      (o) => String(o.owner_id) === String(selectedOwnerId)
    );
    const ownerName = owner ? owner.name : "Owner";

    exportToCsv(
      `Ledger_${ownerName.replace(/\s+/g, "_")}`,
      ledger.map((row) => ({
        date_time: new Date(row.entry_date).toLocaleString(),
        vehicle_number: row.vehicle_number || "",
        material: row.entry_type === "CREDIT" ? row.material_name : row.material_name || "Payment",
        quantity: row.quantity ?? "",
        rate: row.rate_at_sale ?? "",
        amount: Number(row.amount || 0).toFixed(2),
        credit: Number(row.credit_amount || 0).toFixed(2),
        debit: Number(row.debit_amount || 0).toFixed(2),
        balance: Number(row.balance || 0).toFixed(2),
      })),
      [
        { label: "Date & Time", key: "date_time" },
        { label: "Vehicle Number", key: "vehicle_number" },
        { label: "Material / Description", key: "material" },
        { label: "Quantity", key: "quantity" },
        { label: "Rate at Sale (₹)", key: "rate" },
        { label: "Amount (₹)", key: "amount" },
        { label: "Credit (₹)", key: "credit" },
        { label: "Debit (₹)", key: "debit" },
        { label: "Balance (₹)", key: "balance" },
      ]
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Vehicle Owner Ledger</h1>

      {/* Owner selector + payment form */}
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

        {/* Payment form (debit entry) */}
        {selectedOwnerId && (
          <form
            onSubmit={handleRecordPayment}
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: "600" }}>Record Payment (Debit)</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.4rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={{
                  width: "120px",
                  padding: "0.4rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              style={{
                padding: "0.4rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              type="submit"
              disabled={savingPayment}
              style={{
                alignSelf: "flex-start",
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                background: "#16a34a",
                color: "white",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {savingPayment ? "Saving..." : "Add Payment"}
            </button>
          </form>
        )}
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
            <strong>
              Outstanding Balance: ₹{latestBalance.toFixed(2)}
            </strong>
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
                <th style={thS}>Vehicle</th>
                <th style={thS}>Material / Description</th>
                <th style={thS}>Qty</th>
                <th style={thS}>Rate(₹)</th>
                <th style={thS}>Amount (₹)</th>
                <th style={thS}>Credit (₹)</th>
                <th style={thS}>Debit (₹)</th>
                <th style={thS}>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, idx) => {
                const rate = row.rate_at_sale ?? "";
                const amount = Number(row.amount || 0).toFixed(2);
                const credit = Number(row.credit_amount || 0).toFixed(2);
                const debit = Number(row.debit_amount || 0).toFixed(2);
                const balance = Number(row.balance || 0).toFixed(2);

                return (
                  <tr key={idx}>
                    <td style={tdS}>
                      {new Date(row.entry_date).toLocaleString()}
                    </td>
                    <td style={tdS}>{row.vehicle_number || "-"}</td>
                    <td style={tdS}>{row.material_name}</td>
                    <td style={tdS}>{row.quantity ?? "-"}</td>
                    <td style={tdS}>{rate !== "" ? Number(rate).toFixed(2) : "-"}</td>
                    <td style={tdS}>{amount}</td>
                    <td style={tdS}>{credit}</td>
                    <td style={tdS}>{debit}</td>
                    <td style={tdS}>{balance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedOwnerId && ledger.length === 0 && (
        <p>No entries for this owner yet.</p>
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
