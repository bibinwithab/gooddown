import { useEffect, useMemo, useState } from "react";
import {
  fetchMaterials,
  fetchOwners,
  createBill,
  createOwner,
  fetchVehiclesByOwner,
} from "../api";
import BillTemplate from "../components/BillTemplate";
import "../components/BillTemplate.css";

function TransactionPage() {
  const [materials, setMaterials] = useState([]);
  const [owners, setOwners] = useState([]);

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [items, setItems] = useState([
    { materialId: "", quantity: "", mattam: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");
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
    return { ...it, rate, lineTotal: qty * rate };
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

    if (!selectedOwner) return setError("Select a vehicle owner");
    if (!vehicleNumber) return setError("Enter vehicle number");

    const validItems = computedItems.filter(
      (i) => i.materialId && i.quantity > 0
    );
    if (!validItems.length) return setError("Add at least one item");

    try {
      setSubmitting(true);
      const res = await createBill({
        owner_id: selectedOwner.owner_id,
        vehicle_number: vehicleNumber,
        items: validItems.map((i) => ({
          material_id: Number(i.materialId),
          quantity: Number(i.quantity),
        })),
      });

      setBill({
        bill: res.data.bill,
        owner_name: selectedOwner.name,
        items: res.data.items.map((it) => ({
          ...it,
          material_name:
            materials.find((m) => m.material_id === it.material_id)?.name ||
            "Material",
          mattam:
            validItems.find(
              (vi) => String(vi.materialId) === String(it.material_id)
            )?.mattam || "",
        })),
      });

      // Clear the form fields after successful bill generation
      setItems([{ materialId: "", quantity: "", mattam: "" }]);
      setSelectedOwner(null);
      setOwnerSearch("");
      setVehicleNumber("");
      setError("");
    } catch {
      setError("Failed to create bill");
    } finally {
      setSubmitting(false);
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
              <label className="block font-medium mb-1">Vehicle Owner</label>
              <div className="flex gap-2">
                <input
                  value={ownerSearch}
                  onChange={(e) => {
                    setOwnerSearch(e.target.value);
                    setSelectedOwner(null);
                  }}
                  placeholder="Type owner name..."
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="button"
                  title="Add owner"
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
                  { materialId: "", quantity: "", mattam: "" },
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

          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold"
          >
            {submitting ? "Saving..." : "Save & Generate Bill"}
          </button>
        </form>
      </div>

      {/* PREVIEW */}
      {bill && (
        <>
          <div className="flex justify-between items-center mt-4 mb-2">
            <h2 className="text-lg font-semibold">Bill Preview</h2>
            <button
              onClick={() => window.print()}
              className="border px-3 py-1 rounded bg-slate-100"
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
