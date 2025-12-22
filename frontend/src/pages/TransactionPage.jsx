import { useEffect, useMemo, useState } from "react";
import {
  fetchMaterials,
  fetchOwners,
  createBill,
  createOwner,
  fetchVehiclesByOwner,
} from "../api";
import { createPayment } from "../api";
import BillTemplate from "../components/BillTemplate";
import "../components/BillTemplate.css";

function TransactionPage() {
  const [materials, setMaterials] = useState([]);
  const [owners, setOwners] = useState([]);

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [items, setItems] = useState([
    {
      materialId: "",
      quantity: "",
      mattam: "",
      grillMattam: false,
      mattamChecked: false,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [error, setError] = useState("");
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [showNewOwner, setShowNewOwner] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerContact, setNewOwnerContact] = useState("");
  const [creatingOwner, setCreatingOwner] = useState(false);
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  useEffect(() => {
    Promise.all([fetchMaterials(), fetchOwners()])
      .then(([m, o]) => {
        setMaterials(m.data);
        setOwners(o.data);
      })
      .catch(() => setError("Failed to load master data"));
  }, []);

  const filteredOwners = useMemo(() => {
    if (!ownerSearch) return owners;
    return owners.filter((o) =>
      o.name.toLowerCase().includes(ownerSearch.toLowerCase())
    );
  }, [owners, ownerSearch]);

  const resolveRate = (materialId) => {
    const m = materials.find(
      (mm) => String(mm.material_id) === String(materialId)
    );
    return m ? Number(m.rate_per_unit) : 0;
  };

  const computedItems = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const rate = resolveRate(it.materialId);

    // Determine mattam display text based on checkboxes and input
    let mattamDisplay = "";

    // Find the material to check its unit and name
    const material = materials.find(
      (m) => String(m.material_id) === String(it.materialId)
    );
    const materialName = material ? material.name.toUpperCase() : "";
    const materialUnit = material ? (material.unit || "").toUpperCase() : "";

    // Check if it's a countable item (unit is NO or name contains BRICKS, STONE, CEMENT)
    const isCountable =
      materialUnit === "NO" ||
      materialUnit === "BAG" ||
      materialName.includes("BRICKS") ||
      materialName.includes("STONE") ||
      materialName.includes("CEMENT");

    if (isCountable) {
      // For countable items, display quantity as whole number
      mattamDisplay = String(Math.round(qty));
    } else if (it.grillMattam) {
      // If grill mattam is checked and mattam value is entered, combine them
      if (it.mattam) {
        mattamDisplay = `கிரில் மட்டம் + ${it.mattam}`;
      } else {
        mattamDisplay = "கிரில் மட்டம்";
      }
    } else if (it.mattamChecked) {
      mattamDisplay = "மட்டம்";
    } else if (it.mattam) {
      mattamDisplay = `மட்டம் + ${it.mattam}`;
    } else {
      // If mattam checkbox not checked and no mattam value entered, show quantity
      mattamDisplay = String(Math.round(qty));
    }

    return { ...it, rate, lineTotal: qty * rate, mattamDisplay };
  });

  const billTotal = computedItems.reduce((s, i) => s + i.lineTotal, 0);

  const loadVehicleSuggestions = async (value) => {
    if (!selectedOwner || !value) {
      setVehicleSuggestions([]);
      return;
    }

    try {
      const res = await fetchVehiclesByOwner(selectedOwner.owner_id, value);
      setVehicleSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBill(null);

    if (!selectedOwner) return setError("Select a Customer");
    if (!vehicleNumber) return setError("Enter vehicle number");

    const validItems = computedItems.filter(
      (i) => i.materialId && i.quantity > 0
    );
    if (!validItems.length) return setError("Add at least one item");

    try {
      setSubmitting(true);

      // Generate preview data WITHOUT saving to database
      const previewData = {
        owner_id: selectedOwner.owner_id,
        vehicle_number: vehicleNumber,
        items: validItems.map((i) => ({
          material_id: Number(i.materialId),
          quantity: Number(i.quantity),
          material_name:
            materials.find(
              (m) => String(m.material_id) === String(i.materialId)
            )?.name || "Material",
          rate_at_sale: i.rate,
          total_cost: i.lineTotal,
          unit:
            materials.find(
              (m) => String(m.material_id) === String(i.materialId)
            )?.unit || "UNIT",
          mattam: i.mattam || "",
          mattamDisplay: i.mattamDisplay,
          grillMattam: i.grillMattam,
          mattamChecked: i.mattamChecked,
        })),
        total: validItems.reduce((s, i) => s + i.lineTotal, 0),
      };

      setBillPreview({
        owner_name: selectedOwner.name,
        items: previewData.items,
        total: previewData.total,
        vehicle_number: vehicleNumber,
        owner_id: selectedOwner.owner_id,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate bill preview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBill = async () => {
    if (!billPreview) return;

    try {
      setIsSavingBill(true);
      const res = await createBill({
        owner_id: billPreview.owner_id,
        vehicle_number: billPreview.vehicle_number,
        items: billPreview.items.map((i) => ({
          material_id: Number(i.material_id),
          quantity: Number(i.quantity),
        })),
      });

      setBill({
        bill: res.data.bill,
        owner_name: billPreview.owner_name,
        items: billPreview.items.map((previewItem) => {
          const responseItem = res.data.items.find(
            (ri) => Number(ri.material_id) === Number(previewItem.material_id)
          );
          return {
            ...previewItem,
            transaction_id: responseItem?.transaction_id,
            rate_at_sale: previewItem.rate_at_sale,
            total_cost: previewItem.total_cost,
            quantity: previewItem.quantity,
            material_name: previewItem.material_name,
            unit: previewItem.unit,
            mattam: previewItem.mattam,
            mattamDisplay: previewItem.mattamDisplay,
            grillMattam: previewItem.grillMattam,
            mattamChecked: previewItem.mattamChecked,
          };
        }),
      });

      // If user opted to record payment immediately, call createPayment
      if (recordPayment && Number(paymentAmount) > 0) {
        try {
          setSavingPayment(true);
          await createPayment(billPreview.owner_id, {
            amount: Number(paymentAmount),
            mode: paymentMode,
            notes: paymentNote,
          });
        } catch (err) {
          console.error(err);
          setError("Bill saved but failed to record payment");
        } finally {
          setSavingPayment(false);
        }
      }

      // Clear the form fields after successful bill generation
      setItems([
        {
          materialId: "",
          quantity: "",
          mattam: "",
          grillMattam: false,
          mattamChecked: false,
        },
      ]);
      setSelectedOwner(null);
      setOwnerSearch("");
      setVehicleNumber("");
      // clear payment inputs
      setRecordPayment(false);
      setPaymentAmount("");
      setPaymentMode("CASH");
      setPaymentNote("");
      setBillPreview(null);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to save bill");
    } finally {
      setIsSavingBill(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto no-print">
      <h1 className="text-xl font-semibold mb-4">
        Transaction Entry & Bill Generation
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* FORM */}
      <div className="bg-white rounded shadow p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OWNER + VEHICLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block font-medium mb-1">Customer</label>
              <div className="flex gap-2">
                <input
                  value={ownerSearch}
                  onChange={(e) => {
                    setOwnerSearch(e.target.value);
                    setSelectedOwner(null);
                  }}
                  placeholder="Type Customer name..."
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="button"
                  title="Add customer"
                  onClick={() => setShowNewOwner((s) => !s)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  +
                </button>
              </div>

              {ownerSearch && !selectedOwner && (
                <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto">
                  {filteredOwners.map((o) => (
                    <div
                      key={o.owner_id}
                      onClick={() => {
                        setSelectedOwner(o);
                        setOwnerSearch(o.name);
                        setVehicleNumber("");
                        setVehicleSuggestions([]);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-100"
                    >
                      <div>{o.name}</div>
                      {o.contact_info && (
                        <div className="text-xs text-slate-500">
                          {o.contact_info}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showNewOwner && (
                <div className="mt-2 p-3 border rounded bg-slate-50">
                  <div className="flex gap-2">
                    <input
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      placeholder="Owner name"
                      className="w-1/2 border rounded px-2 py-1"
                    />
                    <input
                      value={newOwnerContact}
                      onChange={(e) => setNewOwnerContact(e.target.value)}
                      placeholder="Contact info (optional)"
                      className="w-1/2 border rounded px-2 py-1"
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newOwnerName.trim())
                          return setError("Enter owner name");
                        try {
                          setCreatingOwner(true);
                          setError("");
                          const resp = await createOwner({
                            name: newOwnerName.trim(),
                            contact_info: newOwnerContact.trim() || null,
                          });
                          const created = resp.data;
                          // add to owners list and select
                          setOwners((o) => [...o, created]);
                          setSelectedOwner(created);
                          setOwnerSearch(created.name);
                          // reset new owner form
                          setNewOwnerName("");
                          setNewOwnerContact("");
                          setShowNewOwner(false);
                        } catch (err) {
                          console.error(err);
                          setError("Failed to create owner");
                        } finally {
                          setCreatingOwner(false);
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      disabled={creatingOwner}
                    >
                      {creatingOwner ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewOwner(false);
                        setNewOwnerName("");
                        setNewOwnerContact("");
                      }}
                      className="px-3 py-1 border rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block font-medium mb-1">Vehicle Number</label>

              <input
                value={vehicleNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setVehicleNumber(val);
                  loadVehicleSuggestions(val);
                  setShowVehicleDropdown(true);
                }}
                onFocus={() => {
                  if (vehicleNumber) setShowVehicleDropdown(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowVehicleDropdown(false), 150);
                }}
                placeholder="TN-00-XXXX"
                className="w-full border rounded px-3 py-2"
              />

              {/* 🔽 Vehicle suggestions */}
              {showVehicleDropdown && vehicleSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto">
                  {vehicleSuggestions.map((v, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setVehicleNumber(v.vehicle_number);
                        setShowVehicleDropdown(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-100"
                    >
                      {v.vehicle_number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ITEMS */}
          <div>
            <label className="block font-medium mb-2">Items</label>

            {/* Responsive table */}
            <div className="overflow-hidden">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Material</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Mattam</th>
                    <th className="p-2 text-left">Options</th>
                    <th className="p-2 text-left">Rate</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Delete </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {computedItems.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <select
                          value={row.materialId}
                          onChange={(e) =>
                            setItems((p) =>
                              p.map((x, idx) =>
                                idx === i
                                  ? { ...x, materialId: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="">Select</option>
                          {materials.map((m) => (
                            <option key={m.material_id} value={m.material_id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            setItems((p) =>
                              p.map((x, idx) =>
                                idx === i
                                  ? { ...x, quantity: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          value={row.mattam}
                          onChange={(e) =>
                            setItems((p) =>
                              p.map((x, idx) =>
                                idx === i ? { ...x, mattam: e.target.value } : x
                              )
                            )
                          }
                          placeholder="0"
                          className="w-full border rounded px-2 py-1"
                        />
                      </td>

                      <td className="p-2">
                        <div className="space-y-1">
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={row.grillMattam}
                              onChange={(e) =>
                                setItems((p) =>
                                  p.map((x, idx) =>
                                    idx === i
                                      ? { ...x, grillMattam: e.target.checked }
                                      : x
                                  )
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span>கிரில் மட்டம்</span>
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs block">
                            <input
                              type="checkbox"
                              checked={row.mattamChecked}
                              onChange={(e) =>
                                setItems((p) =>
                                  p.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          mattamChecked: e.target.checked,
                                        }
                                      : x
                                  )
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span>மட்டம்</span>
                          </label>
                        </div>
                      </td>

                      <td className="p-2">₹{row.rate.toFixed(2)}</td>
                      <td className="p-2 font-medium">
                        ₹{row.lineTotal.toFixed(2)}
                      </td>

                      <td className="p-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItems(items.filter((_, idx) => idx !== i))
                            }
                            className="text-red-600 font-bold bg-red-100 px-2 rounded border-1 "
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    materialId: "",
                    quantity: "",
                    mattam: "",
                    grillMattam: false,
                    mattamChecked: false,
                  },
                ])
              }
              className="mt-5 px-2 py-1 border border-indigo-600 bg-indigo-100 rounded text-sm"
            >
              + Add Item
            </button>

            <div className="text-right font-semibold mt-1">
              Bill Total: ₹{billTotal.toFixed(2)}
            </div>
          </div>

          {/* RECORD PAYMENT */}
          <div className="mt-4 bg-slate-50 p-3 rounded">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={recordPayment}
                onChange={(e) => setRecordPayment(e.target.checked)}
              />
              <span className="font-medium">Record payment now</span>
            </label>

            {recordPayment && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="border rounded px-2 py-1"
                />

                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank</option>
                  <option value="OTHER">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || billPreview}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold disabled:bg-gray-400"
          >
            {submitting ? "Generating Preview..." : "Preview Bill"}
          </button>

          {billPreview && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 mb-2">
                ✓ Bill preview generated. Review below and click{" "}
                <strong>Save & Print</strong> to finalize.
              </p>
              <p className="text-xs text-blue-600">
                You can make changes above and generate a new preview anytime.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* PREVIEW SECTION */}
      {billPreview && !bill && (
        <>
          <div className="flex justify-between items-center mt-6 mb-3">
            <h2 className="text-lg font-semibold">Bill Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBill}
                disabled={isSavingBill}
                className="bg-green-600 text-white px-4 py-1 rounded font-semibold disabled:bg-gray-400"
              >
                {isSavingBill ? "Saving..." : "Save & Print"}
              </button>
              <button
                onClick={() => {
                  setBillPreview(null);
                  setError("");
                }}
                className="border px-4 py-1 rounded bg-gray-100"
              >
                Back to Edit
              </button>
            </div>
          </div>

          <div id="print-area-wrapper">
            <BillTemplate
              data={{
                bill: null,
                owner_name: billPreview.owner_name,
                items: billPreview.items,
                total: billPreview.total,
                vehicle_number: billPreview.vehicle_number,
              }}
            />
          </div>
        </>
      )}

      {/* SAVED BILL SECTION */}
      {bill && (
        <>
          <div className="flex justify-between items-center mt-6 mb-3">
            <h2 className="text-lg font-semibold">
              Bill Saved & Ready to Print
            </h2>
            <button
              onClick={() => window.print()}
              className="border px-3 py-1 rounded bg-blue-50 text-sm font-semibold"
            >
              Print Bill
            </button>
          </div>

          <div id="print-area-wrapper">
            <BillTemplate data={bill} />
          </div>
        </>
      )}
    </div>
  );
}

export default TransactionPage;
