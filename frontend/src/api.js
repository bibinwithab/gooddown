// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Materials
export const fetchMaterials = () => api.get("/materials");
export const updateMaterial = (id, payload) =>
  api.put(`/materials/${id}`, payload);

// Owners
export const fetchOwners = () => api.get("/owners");
export const updateOwner = (id, payload) => api.put(`/owners/${id}`, payload);

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
export default api;
