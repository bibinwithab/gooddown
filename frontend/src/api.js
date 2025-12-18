// src/api.js
import axios from "axios";

const host = window.location.hostname;
const api = axios.create({
  baseURL: `http://${host}:4000/api`,
});

// Materials
export const fetchMaterials = () => api.get("/materials");
export const updateMaterial = (id, payload) =>
  api.put(`/materials/${id}`, payload);

export const createMaterial = (data) => api.post("/materials", data);

// Owners
export const fetchOwners = () => api.get("/owners");
export const updateOwner = (id, payload) => api.put(`/owners/${id}`, payload);
export const createOwner = (data) => api.post("/owners", data);

// Transactions
export const createTransaction = (data) => api.post("/transactions", data);
export const fetchLedger = (ownerId) =>
  api.get(`/transactions/ledger/${ownerId}`);

// Reports
export const fetchOwnerAccountsSummary = (from, to) =>
  api.get("/reports/owners-summary", {
    params: { from, to },
  });

// Bills
export const createBill = (data) => api.post("/bills", data);

// Payments
export const fetchPaymentLedger = (ownerId) =>
  api.get(`/owners/${ownerId}/ledger`);

export const createPayment = (ownerId, payload) =>
  api.post(`/owners/${ownerId}/payments`, payload);

// Vehicles
export const fetchVehiclesByOwner = (ownerId, query = "") =>
  api.get("/vehicles", {
    params: { owner_id: ownerId, q: query },
  });

export default api;
