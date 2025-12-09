// src/pages/TransactionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchMaterials, fetchOwners, createBill } from "../api";
import BillTemplate from "../components/BillTemplate";
import "../components/BillTemplate.css";

function TransactionPage() {
  const [materials, setMaterials] = useState([]);
  const [owners, setOwners] = useState([]);

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerSearch, setOwnerSearch] = useState("");

  const [vehicleNumber, setVehicleNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState(null); // bill data after creation
  const [error, setError] = useState("");

  // items = rows in the bill: { materialId, quantity }
  const [items, setItems] = useState([{ materialId: "", quantity: "" }]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matRes, ownRes] = await Promise.all([
          fetchMaterials(),
          fetchOwners(),
        ]);
        setMaterials(matRes.data);
        setOwners(ownRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load master data");
      }
    };

    loadData();
  }, []);

  const filteredOwners = useMemo(() => {
    if (!ownerSearch) return owners;
    return owners.filter((o) =>
      o.name.toLowerCase().includes(ownerSearch.toLowerCase())
    );
  }, [owners, ownerSearch]);

  const handleOwnerSelect = (owner) => {
    setSelectedOwner(owner);
    setOwnerSearch(owner.name);
  };

  // ---- items helpers ----
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { materialId: "", quantity: "" }]);
  };

  const removeItemRow = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ materialId: "", quantity: "" }]);
  };

  const resolveRate = (materialId) => {
    const m = materials.find(
      (mm) => String(mm.material_id) === String(materialId)
    );
    return m ? Number(m.rate_per_unit) : 0;
  };

  const computedItems = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const rate = resolveRate(it.materialId);
    const lineTotal = qty * rate;
    return { ...it, rate, lineTotal };
  });

  const billTotal = computedItems.reduce((sum, it) => sum + it.lineTotal, 0);

  // ---- submit = create bill with multiple items ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBill(null);

    if (!selectedOwner) {
      setError("Please select a vehicle owner");
      return;
    }

    if (!vehicleNumber) {
      setError("Please enter vehicle number");
      return;
    }

    const validItems = computedItems.filter(
      (it) => it.materialId && Number(it.quantity) > 0 && it.lineTotal > 0
    );

    if (validItems.length === 0) {
      setError("Please add at least one valid item (material + quantity)");
      return;
    }

    try {
      setSubmitting(true);

      const res = await createBill({
        owner_id: selectedOwner.owner_id,
        vehicle_number: vehicleNumber,
        items: validItems.map((it) => ({
          material_id: Number(it.materialId),
          quantity: Number(it.quantity),
        })),
      });

      // Build data for BillTemplate
      const billFromApi = res.data.bill;
      const itemsFromApi = res.data.items || [];

      const enrichedItems = itemsFromApi.map((item) => {
        const material = materials.find(
          (m) => m.material_id === item.material_id
        );
        return {
          ...item,
          material_name: material
            ? material.name
            : `Material ${item.material_id}`,
        };
      });

      setBill({
        bill: billFromApi,
        owner_name: selectedOwner.name,
        items: enrichedItems,
      });

      // Optional: reset form items for next bill
      // setItems([{ materialId: "", quantity: "" }]);
    } catch (err) {
      console.error(err);
      setError("Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="no-print">
      <h1 style={{ marginBottom: "1rem" }}>
        Transaction Entry & Bill Generation
      </h1>

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

      {/* Form card */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
          maxWidth: "720px",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Owner auto-suggest */}
          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label style={{ display: "block", fontWeight: "600" }}>
              Vehicle Owner Name
            </label>
            <input
              type="text"
              value={ownerSearch}
              onChange={(e) => {
                setOwnerSearch(e.target.value);
                setSelectedOwner(null);
              }}
              placeholder="Type owner name..."
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
            {/* Dropdown */}
            {ownerSearch && !selectedOwner && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderTop: "none",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {filteredOwners.length === 0 && (
                  <div style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
                    No owners found
                  </div>
                )}
                {filteredOwners.map((o) => (
                  <div
                    key={o.owner_id}
                    onClick={() => handleOwnerSelect(o)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>{o.name}</div>
                    {o.contact_info && (
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {o.contact_info}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Number */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: "600" }}>
              Vehicle Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="TN-00-XXXX"
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>

          {/* Items table */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Items
            </label>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Rate (₹)</th>
                  <th style={thStyle}>Line Total (₹)</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {computedItems.map((row, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>
                      <select
                        value={row.materialId}
                        onChange={(e) =>
                          handleItemChange(index, "materialId", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        <option value="">Select</option>
                        {materials.map((m) => (
                          <option key={m.material_id} value={m.material_id}>
                            {m.name} (₹{m.rate_per_unit}/{m.unit})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={row.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "0.3rem",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {row.rate ? row.rate.toFixed(2) : ""}
                    </td>
                    <td style={tdStyle}>
                      {row.lineTotal ? row.lineTotal.toFixed(2) : ""}
                    </td>
                    <td style={tdStyle}>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #e11d48",
                            background: "#fee2e2",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              onClick={addItemRow}
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: "#e5f4ff",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              + Add Item
            </button>

            <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
              <strong>Bill Total: ₹{billTotal.toFixed(2)}</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.6rem 1.2rem",
              background: "#2563eb",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {submitting ? "Saving..." : "Save & Generate Bill"}
          </button>
        </form>
      </div>

      {/* Bill Preview + Print */}
      {/* Bill Preview UI + Print button (on screen only) */}
      {bill && (
        <div
          className="no-print" /* optional, only for screen */
          style={{
            marginTop: "1rem",
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "720px",
          }}
        >
          <h2 style={{ margin: 0 }}>Bill Preview</h2>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
              cursor: "pointer",
            }}
          >
            Print Bill
          </button>
        </div>
      )}

      {/* ✅ This is the ONLY thing we want to print */}
      {bill && (
        <div id="print-area-wrapper">
          <BillTemplate data={bill} />
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "0.4rem",
};

const tdStyle = {
  borderBottom: "1px solid #f1f5f9",
  padding: "0.4rem",
};

export default TransactionPage;
