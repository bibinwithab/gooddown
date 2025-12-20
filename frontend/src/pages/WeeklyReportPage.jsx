import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:4000/api"; // adjust if needed

function WeeklyReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/weekly-reports`, {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load weekly report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Weekly Owner Ledger Report</h1>

      {/* FILTER */}
      <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={loadReport}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold"
        >
          Apply
        </button>

        {report && (
          <button
            onClick={async () => {
              try {
                const mod = await import("../utils/exportWeeklyLedgerToExcel");
                mod.exportWeeklyLedgerToExcel(
                  `WEEKLY_REPORT_${fromDate}_TO_${toDate}`,
                  report
                );
              } catch (err) {
                console.error("Failed to export Excel:", err);
                setError("Failed to export Excel file");
              }
            }}
            className="ml-auto border px-4 py-2 rounded bg-emerald-50 font-medium"
          >
            Export Excel
          </button>
        )}
      </div>

      {loading && <p>Loading report…</p>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {/* REPORT PREVIEW */}
      {report?.owners?.length > 0 && (
        <div className="space-y-6">
          {report.owners.map((owner, oi) => (
            <div key={oi} className="bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-3">{owner.owner_name}</h2>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Material</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Rate</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Paid</th>
                      <th className="p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owner.entries.map((entry, ei) => (
                      <FragmentRow key={ei} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-3">
                {owner.entries.map((entry, ei) => (
                  <div key={ei} className="border rounded p-3 text-sm">
                    <div className="font-semibold mb-1">
                      {formatDate(entry.date)}
                    </div>

                    {entry.items.map((it, ii) => (
                      <div key={ii} className="flex justify-between">
                        <span>{it.material}</span>
                        <span>₹{it.total}</span>
                      </div>
                    ))}

                    <div className="mt-2 font-semibold">
                      Total: ₹{entry.day_total}
                    </div>
                    {entry.paid > 0 && <div>Paid: ₹{entry.paid}</div>}
                    <div className="font-semibold">
                      Balance: ₹{entry.balance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && report && report.owners.length === 0 && (
        <p>No data for selected period.</p>
      )}
    </div>
  );
}

/* ---------- HELPERS ---------- */

function FragmentRow({ entry }) {
  return (
    <>
      {entry.items.map((it, i) => (
        <tr key={i} className="border-b">
          <td className="p-2">{i === 0 ? formatDate(entry.date) : ""}</td>
          <td className="p-2">{it.material}</td>
          <td className="p-2 text-center">{it.qty ?? "-"}</td>
          <td className="p-2 text-center">{it.rate ?? "-"}</td>
          <td className="p-2 text-right">₹{it.total}</td>
          <td className="p-2 text-right">
            {i === 0 && entry.paid ? `₹${entry.paid}` : ""}
          </td>
          <td className="p-2 text-right"></td>
        </tr>
      ))}

      <tr className="bg-yellow-50 font-semibold">
        <td></td>
        <td className="p-2">TOTAL</td>
        <td></td>
        <td></td>
        <td className="p-2 text-right">₹{entry.day_total}</td>
        <td className="p-2 text-right">{entry.paid ? `₹${entry.paid}` : ""}</td>
        <td className="p-2 text-right">₹{entry.balance}</td>
      </tr>
    </>
  );
}

function formatDate(d) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default WeeklyReportPage;
