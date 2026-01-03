import { useEffect, useState } from "react";
import { fetchBills, fetchBillDetails } from "../api";

function BillsPage() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchBills(ownerFilter || undefined);
      setBills(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bills" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBill = async (billId) => {
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Saved Bills</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bills List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow p-4">
            <div className="mb-4">
              <button
                onClick={loadBills}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700"
              >
                {loading ? "Loading..." : "Refresh Bills"}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bills.length === 0 ? (
                <p className="text-gray-500 text-sm">No bills found</p>
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
                      {new Date(bill.bill_timestamp).toLocaleDateString(
                        "en-IN"
                      )}
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      ₹{Number(bill.total_amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
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
                    {new Date(billDetails.bill.bill_timestamp).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(selectedBill)}
                  className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700"
                >
                  ⬇ Download PDF
                </button>
              </div>

              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <p>
                  <span className="text-gray-600">Name:</span>{" "}
                  <span className="font-semibold">
                    {billDetails.bill.owner_name}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Vehicle:</span>{" "}
                  <span className="font-semibold">
                    {billDetails.bill.vehicle_number}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
                  {billDetails.items.map((item, idx) => {
                    // Helper function to display quantity
                    const qtyDisplay = (q) => {
                      const n = Number(q);
                      if (Number.isFinite(n)) return String(Math.round(n));
                      return q ?? "";
                    };

                    // Mattam display logic (same as BillTemplate)
                    const getMattamDisplay = () => {
                      const name = (item.material_name || "").toUpperCase();
                      const unit = (item.unit || "").toUpperCase();

                      // Check if it's a countable item
                      const isNoUnit =
                        unit === "NO" ||
                        name.includes("BRICKS") ||
                        name.includes("STONE") ||
                        name.includes("CEMENT");

                      if (isNoUnit) {
                        return qtyDisplay(item.quantity);
                      }

                      // Handle grill mattam
                      if (item.grill_mattam) {
                        if (item.mattam) {
                          return `கிரில் மட்டம் + ${item.mattam}`;
                        } else {
                          return "கிரில் மட்டம்";
                        }
                      }

                      // Handle regular mattam checkbox
                      if (item.mattam_checked) {
                        if (item.mattam) {
                          return `மட்டம் + ${item.mattam}`;
                        } else {
                          return "மட்டம்";
                        }
                      }

                      // Handle mattam with number (when checkbox not checked)
                      const mattamRaw = item.mattam;
                      const mattamStr =
                        mattamRaw == null ? "" : String(mattamRaw).trim();

                      if (mattamStr === "") return qtyDisplay(item.quantity);

                      const mattamNum = Number(mattamStr);
                      if (Number.isFinite(mattamNum)) {
                        if (mattamNum === 0) return qtyDisplay(item.quantity);
                        return "மட்டம்" + " + " + `${Math.round(mattamNum)}`;
                      }

                      return mattamStr;
                    };

                    return (
                      <div
                        key={idx}
                        className="border rounded p-3 bg-gray-50 flex justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {item.material_name || "Material"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getMattamDisplay()}
                          </div>
                        </div>
                        <div className="text-right text-sm space-y-1">
                          <div>
                            Qty:{" "}
                            <span className="font-semibold">
                              {qtyDisplay(item.quantity)}
                            </span>
                          </div>
                          <div>
                            Rate:{" "}
                            <span className="font-semibold">
                              ₹{Number(item.rate_at_sale).toFixed(0)}
                            </span>
                          </div>
                          <div>
                            Amt:{" "}
                            <span className="font-semibold">
                              ₹{Number(item.total_cost).toFixed(0)}
                            </span>
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
                  <span className="text-indigo-600">
                    ₹{Number(billDetails.bill.total_amount).toFixed(2)}
                  </span>
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
