import { useEffect, useRef, useState, useCallback } from "react";
import { fetchBills, fetchBillDetails } from "../api";

const PAGE_SIZE = 25;

function BillsPage() {
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadBills = useCallback(async (q, pg) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchBills({
        q: q || undefined,
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
      });
      setBills(res.data.bills);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load bills: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills("", 0);
  }, [loadBills]);

  const handleSearchChange = (val) => {
    setSearchQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSelectedBill(null);
      setBillDetails(null);
      loadBills(val, 0);
    }, 300);
  };

  const goToPage = (pg) => {
    if (pg < 0 || pg >= totalPages) return;
    setPage(pg);
    setSelectedBill(null);
    setBillDetails(null);
    loadBills(searchQ, pg);
  };

  const handleSelectBill = async (billId) => {
    if (selectedBill === billId) return;
    try {
      setError("");
      const res = await fetchBillDetails(billId);
      setSelectedBill(billId);
      setBillDetails(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bill details");
    }
  };

  const handleDownloadPDF = (billId) => {
    const link = document.createElement("a");
    link.href = `http://${window.location.hostname}:4000/api/bills/${billId}/download`;
    link.download = true;
    link.click();
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

    if (start > 0) {
      pages.push(
        <button key={0} onClick={() => goToPage(0)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
          1
        </button>
      );
      if (start > 1) pages.push(<span key="s1" className="px-1 text-xs text-slate-400">...</span>);
    }
    for (let i = start; i < end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-2 py-1 text-xs border rounded ${
            i === page ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-100"
          }`}
        >
          {i + 1}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="s2" className="px-1 text-xs text-slate-400">...</span>);
      pages.push(
        <button key={totalPages - 1} onClick={() => goToPage(totalPages - 1)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">
          {totalPages}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Saved Bills</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search + Refresh + Count */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchQ}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer name or vehicle number..."
            className="flex-1 min-w-[200px] border rounded px-3 py-2"
          />
          <button
            onClick={() => {
              setSelectedBill(null);
              setBillDetails(null);
              loadBills(searchQ, page);
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          {!loading && (
            <span className="text-sm text-slate-500">
              {total} bill{total !== 1 ? "s" : ""} found
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bills List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow p-4">
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {bills.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {loading ? "Loading..." : "No bills found"}
                </p>
              ) : (
                bills.map((bill) => (
                  <div
                    key={bill.bill_id}
                    onClick={() => handleSelectBill(bill.bill_id)}
                    className={`p-3 rounded cursor-pointer border-2 transition ${
                      selectedBill === bill.bill_id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      Bill #{bill.daily_bill_no}
                    </div>
                    <div className="text-xs text-gray-600">
                      {bill.owner_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(bill.bill_timestamp).toLocaleDateString("en-IN")}
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      ₹{Number(bill.total_amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-1 flex-wrap">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 0}
                  className="px-2 py-1 text-xs border rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 text-xs border rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="lg:col-span-2">
          {selectedBill && billDetails ? (
            <div className="bg-white rounded shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Bill #{billDetails.bill.daily_bill_no}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(billDetails.bill.bill_timestamp).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(selectedBill)}
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                >
                  Download PDF
                </button>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <p>
                  <span className="text-gray-600">Name:</span>{" "}
                  <span className="font-semibold">{billDetails.bill.owner_name}</span>
                </p>
                <p>
                  <span className="text-gray-600">Vehicle:</span>{" "}
                  <span className="font-semibold">{billDetails.bill.vehicle_number}</span>
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
                  {billDetails.items.map((item, idx) => {
                    const qtyDisplay = (q) => {
                      const n = Number(q);
                      if (Number.isFinite(n)) return String(Math.round(n));
                      return q ?? "";
                    };

                    const getMattamDisplay = () => {
                      const name = (item.material_name || "").toUpperCase();
                      const unit = (item.unit || "").toUpperCase();

                      const isNoUnit =
                        unit === "NO" ||
                        name.includes("BRICKS") ||
                        name.includes("STONE") ||
                        name.includes("CEMENT");

                      if (isNoUnit) return qtyDisplay(item.quantity);

                      if (item.grill_mattam) {
                        if (item.mattam) return `கிரில் மட்டம் + ${item.mattam}`;
                        return "கிரில் மட்டம்";
                      }

                      if (item.mattam_checked) {
                        if (item.mattam) return `மட்டம் + ${item.mattam}`;
                        return "மட்டம்";
                      }

                      const mattamRaw = item.mattam;
                      const mattamStr = mattamRaw == null ? "" : String(mattamRaw).trim();

                      if (mattamStr === "") return qtyDisplay(item.quantity);

                      const mattamNum = Number(mattamStr);
                      if (Number.isFinite(mattamNum)) {
                        if (mattamNum === 0) return qtyDisplay(item.quantity);
                        return "மட்டம்" + " + " + `${Math.round(mattamNum)}`;
                      }

                      return mattamStr;
                    };

                    return (
                      <div key={idx} className="border rounded p-3 bg-gray-50 flex justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {item.material_name || "Material"}
                          </div>
                          <div className="text-sm text-gray-600">{getMattamDisplay()}</div>
                        </div>
                        <div className="text-right text-sm space-y-1">
                          <div>
                            Qty: <span className="font-semibold">{qtyDisplay(item.quantity)}</span>
                          </div>
                          <div>
                            Rate: <span className="font-semibold">₹{Number(item.rate_at_sale).toFixed(0)}</span>
                          </div>
                          <div>
                            Amt: <span className="font-semibold">₹{Number(item.total_cost).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-indigo-600">₹{Number(billDetails.bill.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded shadow p-6 text-center text-gray-500">
              Select a bill to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BillsPage;
