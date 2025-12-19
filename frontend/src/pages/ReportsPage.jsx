import { useEffect, useMemo, useState } from "react";
import { fetchOwnerAccountsSummary } from "../api";
import { exportToCsv } from "../utils/exportToCSV";

const todayStr = new Date().toISOString().slice(0, 10);

function ReportsPage() {
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortByLatest, setSortByLatest] = useState(false);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line
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
    } catch {
      setError("Failed to load owner accounts summary");
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    const arr = [...data];
    if (sortByLatest) {
      arr.sort((a, b) => {
        const da = a.last_activity ? new Date(a.last_activity) : new Date(0);
        const db = b.last_activity ? new Date(b.last_activity) : new Date(0);
        return db - da;
      });
    } else {
      arr.sort((a, b) => a.owner_name.localeCompare(b.owner_name));
    }
    return arr;
  }, [data, sortByLatest]);

  const totals = {
    credit: data.reduce((s, r) => s + Number(r.total_credit || 0), 0),
    debit: data.reduce((s, r) => s + Number(r.total_debit || 0), 0),
    balance: data.reduce((s, r) => s + Number(r.balance || 0), 0),
  };

  const handleExport = () => {
    if (!sortedData.length) return;
    exportToCsv(
      `OwnerAccounts_${effectiveFrom}_to_${effectiveTo}`,
      sortedData.map((r) => ({
        owner_name: r.owner_name,
        total_credit: Number(r.total_credit || 0).toFixed(2),
        total_debit: Number(r.total_debit || 0).toFixed(2),
        balance: Number(r.balance || 0).toFixed(2),
        last_activity: r.last_activity
          ? new Date(r.last_activity).toLocaleString()
          : "",
      })),
      [
        { label: "Owner Name", key: "owner_name" },
        { label: "Total Credit (₹)", key: "total_credit" },
        { label: "Total Paid (₹)", key: "total_debit" },
        { label: "Balance (₹)", key: "balance" },
        { label: "Last Activity", key: "last_activity" },
      ]
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Owner Accounts – Balance by Period
      </h1>

      {/* FILTER */}
      <div className="bg-white rounded shadow p-4 mb-4 max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSummary();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button className="bg-indigo-600 text-white rounded px-4 py-2 font-semibold">
            Apply
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-2">
          Showing: <strong>{effectiveFrom}</strong> →{" "}
          <strong>{effectiveTo}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* SUMMARY BAR */}
      {!loading && (
        <div className="flex flex-wrap gap-2 justify-between items-center mb-3 text-sm">
          <div className="text-xl">
            <strong>Total Owners:</strong> {data.length} &nbsp;|&nbsp;
            <strong>Credit:</strong> ₹{totals.credit.toFixed(2)} &nbsp;|&nbsp;
            <strong>Paid:</strong> ₹{totals.debit.toFixed(2)} &nbsp;|&nbsp;
            <strong>Balance:</strong> ₹{totals.balance.toFixed(2)}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={sortByLatest}
                onChange={(e) => setSortByLatest(e.target.checked)}
              />
              Sort by latest
            </label>
            <button
              onClick={handleExport}
              className="border px-3 py-1 rounded bg-blue-50"
            >
              Export
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CARDS */}
      <div className="space-y-3 md:hidden">
        {sortedData.map((r) => (
          <div key={r.owner_id} className="bg-white rounded shadow p-3">
            <div className="text-lg font-semibold">{r.owner_name}</div>
            <div className="text-sm mt-1">
              Credit: ₹{Number(r.total_credit || 0).toFixed(2)}
            </div>
            <div className="text-sm">
              Paid: ₹{Number(r.total_debit || 0).toFixed(2)}
            </div>
            <div className="font-semibold mt-1">
              Balance: ₹{Number(r.balance || 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Last activity:{" "}
              {r.last_activity
                ? new Date(r.last_activity).toLocaleString()
                : "-"}
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
                "Owner",
                "Total Credit",
                "Total Paid",
                "Balance",
                "Last Activity",
              ].map((h) => (
                <th key={h} className="p-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((r) => (
              <tr key={r.owner_id} className="border-b">
                <td className="p-2">{r.owner_name}</td>
                <td className="p-2">
                  ₹{Number(r.total_credit || 0).toFixed(2)}
                </td>
                <td className="p-2">
                  ₹{Number(r.total_debit || 0).toFixed(2)}
                </td>
                <td className="p-2 font-semibold">
                  ₹{Number(r.balance || 0).toFixed(2)}
                </td>
                <td className="p-2">
                  {r.last_activity
                    ? new Date(r.last_activity).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="mt-3">Loading reports…</p>}
    </div>
  );
}

export default ReportsPage;
