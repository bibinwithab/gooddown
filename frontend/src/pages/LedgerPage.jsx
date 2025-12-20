import { useEffect, useState } from "react";
import { fetchOwners, fetchPaymentLedger, createPayment } from "../api";
import { exportToCsv } from "../utils/exportToCSV";

function LedgerPage() {
  const [owners, setOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchOwners()
      .then((res) => setOwners(res.data))
      .catch(console.error);
  }, []);

  const loadLedger = async (ownerId) => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await fetchPaymentLedger(ownerId);
      setLedger(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const latestBalance = () => {
    if (ledger.length === 0) return 0;
    // Get the last entry (most recent in ascending order)
    const lastEntry = ledger[ledger.length - 1];
    return Number(lastEntry.balance || 0);
  };

  const displayBalance = latestBalance();

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!selectedOwnerId || !amt || amt <= 0) return;

    try {
      setSavingPayment(true);
      await createPayment(selectedOwnerId, {
        amount: amt,
        mode: paymentMode,
        notes: paymentNote,
      });
      setPaymentAmount("");
      setPaymentNote("");
      await loadLedger(selectedOwnerId);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleExportLedger = () => {
    if (!selectedOwnerId || ledger.length === 0) return;

    const owner = owners.find(
      (o) => String(o.owner_id) === String(selectedOwnerId)
    );
    const ownerName = owner ? owner.name : "Customer";

    exportToCsv(
      `Ledger_${ownerName.replace(/\s+/g, "_")}`,
      ledger.map((row) => ({
        date_time: row.entry_date ? formatDateDMY(row.entry_date) : "",
        vehicle_number: row.vehicle_number || "",
        material:
          row.entry_type === "CREDIT"
            ? row.material_name
            : row.material_name || "Payment",
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
      ],
      { title: ownerName }
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Customer Ledger</h1>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* OWNER SELECT */}
        <div className="bg-white rounded shadow p-4">
          <label className="block font-medium mb-1">Select Customer</label>
          <select
            value={selectedOwnerId}
            onChange={(e) => {
              setSelectedOwnerId(e.target.value);
              setLedger([]);
              if (e.target.value) loadLedger(e.target.value);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Choose owner...</option>
            {owners.map((o) => (
              <option key={o.owner_id} value={o.owner_id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* PAYMENT */}
        {selectedOwnerId && (
          <div className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">Record Payment (Debit)</div>

            <form onSubmit={handleRecordPayment} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                />
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
              />

              <button
                type="submit"
                disabled={savingPayment}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
              >
                {savingPayment ? "Saving..." : "Add Payment"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* BALANCE + EXPORT */}
      {ledger.length > 0 && (
        <div className="flex justify-between items-center mb-2">
          <strong>Outstanding Balance: ₹{displayBalance.toFixed(2)}</strong>
          <button
            onClick={handleExportLedger}
            className="border px-3 py-1 rounded bg-blue-50 text-sm"
          >
            Export to Excel
          </button>
        </div>
      )}

      {/* MOBILE LEDGER (CARDS) */}
      <div className="space-y-3 md:hidden">
        {ledger.map((row, i) => (
          <div key={i} className="bg-white rounded shadow p-3 text-sm">
            <div className="font-semibold">{formatDateDMY(row.entry_date)}</div>
            <div>Vehicle: {row.vehicle_number || "-"}</div>
            <div>Material: {row.material_name}</div>
            <div>Qty: {row.quantity ?? "-"}</div>
            <div>Rate: ₹{row.rate_at_sale ?? "-"}</div>
            <div>Amount: ₹{Number(row.amount || 0).toFixed(2)}</div>
            <div>Credit: ₹{Number(row.credit_amount || 0).toFixed(2)}</div>
            <div>Debit: ₹{Number(row.debit_amount || 0).toFixed(2)}</div>
            <div className="font-semibold">
              Balance: ₹{Number(row.balance || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {[
                "Date & Time",
                "Vehicle",
                "Material",
                "Qty",
                "Rate",
                "Amount",
                "Credit",
                "Debit",
                "Balance",
              ].map((h) => (
                <th key={h} className="p-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.map((row, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{formatDateDMY(row.entry_date)}</td>
                <td className="p-2">{row.vehicle_number || "-"}</td>
                <td className="p-2">{row.material_name}</td>
                <td className="p-2">{row.quantity ?? "-"}</td>
                <td className="p-2">{row.rate_at_sale ?? "-"}</td>
                <td className="p-2">₹{Number(row.amount || 0).toFixed(2)}</td>
                <td className="p-2">
                  ₹{Number(row.credit_amount || 0).toFixed(2)}
                </td>
                <td className="p-2">
                  ₹{Number(row.debit_amount || 0).toFixed(2)}
                </td>
                <td className="p-2 font-semibold">
                  ₹{Number(row.balance || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="mt-2">Loading ledger…</p>}
    </div>
  );
}

export default LedgerPage;
