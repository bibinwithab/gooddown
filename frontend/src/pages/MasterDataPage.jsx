// src/pages/MasterDataPage.jsx
import { useEffect, useState } from "react";
import {
  fetchMaterials,
  fetchOwners,
  updateMaterial,
  updateOwner,
  createMaterial,
} from "../api";

function MasterDataPage() {
  const [materials, setMaterials] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    rate_per_unit: "",
    unit: "",
    is_active: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [matRes, ownRes] = await Promise.all([
          fetchMaterials(),
          fetchOwners(),
        ]);
        setMaterials(matRes.data);
        setOwners(ownRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load master data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMaterialChange = (id, field, value) => {
    setMaterials((prev) =>
      prev.map((m) => (m.material_id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleOwnerChange = (id, field, value) => {
    setOwners((prev) =>
      prev.map((o) => (o.owner_id === id ? { ...o, [field]: value } : o))
    );
  };

  const saveMaterial = async (m) => {
    try {
      setSavingId(`mat-${m.material_id}`);
      setError("");
      const res = await updateMaterial(m.material_id, {
        name: m.name,
        rate_per_unit: Number(m.rate_per_unit),
        unit: m.unit,
        is_active: m.is_active,
      });

      const updated = res.data || res;

      setMaterials((prev) =>
        prev.map((mm) => (mm.material_id === m.material_id ? updated : mm))
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error || "Failed to save material. Check console."
      );
    } finally {
      setSavingId(null);
    }
  };

  const saveNewMaterial = async () => {
    if (!newMaterial.name || !newMaterial.rate_per_unit || !newMaterial.unit) {
      alert("Fill all material fields");
      return;
    }

    try {
      setSavingId("new-mat");

      const res = await createMaterial({
        name: newMaterial.name,
        rate_per_unit: Number(newMaterial.rate_per_unit),
        unit: newMaterial.unit,
        is_active: newMaterial.is_active,
      });

      const created = res.data || res;

      // Add to list
      setMaterials((prev) => [created, ...prev]);

      // Reset form
      setNewMaterial({
        name: "",
        rate_per_unit: "",
        unit: "",
        is_active: true,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add material");
    } finally {
      setSavingId(null);
    }
  };

  const saveOwner = async (o) => {
    try {
      setSavingId(`own-${o.owner_id}`);
      setError("");
      const res = await updateOwner(o.owner_id, {
        name: o.name,
        contact_info: o.contact_info,
        is_active: o.is_active,
      });

      const updated = res.data || res;

      setOwners((prev) =>
        prev.map((oo) => (oo.owner_id === o.owner_id ? updated : oo))
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error || "Failed to save owner. Check console."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Master Data – Materials & Owners</h1>

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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Materials */}
          <section
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ marginBottom: "0.5rem" }}>Materials</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thS}>Name</th>
                  <th style={thS}>Rate (₹)</th>
                  <th style={thS}>Unit</th>
                  <th style={thS}>Active</th>
                  <th style={thS}></th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#A1EDA4" }}>
                  <td style={tdS}>
                    <input
                      type="text"
                      placeholder="New material name"
                      value={newMaterial.name}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, name: e.target.value })
                      }
                      style={{ ...inputCell, border: "1px solid #fff" }}
                    />
                  </td>

                  <td style={tdS}>
                    <input
                      type="number"
                      placeholder="Rate"
                      value={newMaterial.rate_per_unit}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          rate_per_unit: e.target.value,
                        })
                      }
                      style={{ ...inputCell, border: "1px solid #fff" }}
                    />
                  </td>

                  <td style={tdS}>
                    <input
                      type="text"
                      placeholder="Unit"
                      value={newMaterial.unit}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, unit: e.target.value })
                      }
                      style={{ ...inputCell, border: "1px solid #fff" }}
                    />
                  </td>

                  <td style={tdS}>
                    <input
                      type="checkbox"
                      checked={newMaterial.is_active}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  </td>

                  <td style={tdS}>
                    <button
                      type="button"
                      onClick={saveNewMaterial}
                      disabled={savingId === "new-mat"}
                      style={smallBtn}
                    >
                      {savingId === "new-mat" ? "Adding..." : "Add"}
                    </button>
                  </td>
                </tr>

                {materials.map((m) => (
                  <tr key={m.material_id}>
                    <td style={tdS}>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) =>
                          handleMaterialChange(
                            m.material_id,
                            "name",
                            e.target.value
                          )
                        }
                        style={inputCell}
                      />
                    </td>
                    <td style={tdS}>
                      <input
                        type="number"
                        value={m.rate_per_unit}
                        onChange={(e) =>
                          handleMaterialChange(
                            m.material_id,
                            "rate_per_unit",
                            e.target.value
                          )
                        }
                        style={inputCell}
                      />
                    </td>
                    <td style={tdS}>
                      <input
                        type="text"
                        value={m.unit}
                        onChange={(e) =>
                          handleMaterialChange(
                            m.material_id,
                            "unit",
                            e.target.value
                          )
                        }
                        style={inputCell}
                      />
                    </td>
                    <td style={tdS}>
                      <input
                        type="checkbox"
                        checked={!!m.is_active}
                        onChange={(e) =>
                          handleMaterialChange(
                            m.material_id,
                            "is_active",
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td style={tdS}>
                      <button
                        type="button"
                        onClick={() => saveMaterial(m)}
                        disabled={savingId === `mat-${m.material_id}`}
                        style={smallBtn}
                      >
                        {savingId === `mat-${m.material_id}`
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Owners */}
          <section
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginBottom: "0.5rem" }}>Vehicle Owners</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th style={thS}>Name</th>
                  <th style={thS}>Contact Info</th>
                  <th style={thS}>Active</th>
                  <th style={thS}></th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o) => (
                  <tr key={o.owner_id}>
                    <td style={tdS}>
                      <input
                        type="text"
                        value={o.name}
                        onChange={(e) =>
                          handleOwnerChange(o.owner_id, "name", e.target.value)
                        }
                        style={inputCell}
                      />
                    </td>
                    <td style={tdS}>
                      <input
                        type="text"
                        value={o.contact_info || ""}
                        onChange={(e) =>
                          handleOwnerChange(
                            o.owner_id,
                            "contact_info",
                            e.target.value
                          )
                        }
                        style={inputCell}
                      />
                    </td>
                    <td style={tdS}>
                      <input
                        type="checkbox"
                        checked={!!o.is_active}
                        onChange={(e) =>
                          handleOwnerChange(
                            o.owner_id,
                            "is_active",
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td style={tdS}>
                      <button
                        type="button"
                        onClick={() => saveOwner(o)}
                        disabled={savingId === `own-${o.owner_id}`}
                        style={smallBtn}
                      >
                        {savingId === `own-${o.owner_id}`
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
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

const inputCell = {
  width: "100%",
  padding: "0.25rem",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
  fontSize: "0.85rem",
};

const smallBtn = {
  padding: "0.2rem 0.6rem",
  borderRadius: "4px",
  border: "1px solid #cbd5e1",
  background: "#e5f4ff",
  cursor: "pointer",
  fontSize: "0.8rem",
};

export default MasterDataPage;
