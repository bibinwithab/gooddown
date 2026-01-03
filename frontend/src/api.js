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
export const deleteTransaction = (transactionId) =>
  api.delete(`/transactions/${transactionId}`);
export const updateTransaction = (transactionId, payload) =>
  api.put(`/transactions/${transactionId}`, payload);

// Reports
export const fetchOwnerAccountsSummary = (from, to) =>
  api.get("/reports/owners-summary", {
    params: { from, to },
  });

// Bills
export const createBill = (data) => api.post("/bills", data);
export const fetchBills = (ownerId) =>
  ownerId
    ? api.get("/bills", { params: { owner_id: ownerId } })
    : api.get("/bills");
export const fetchBillDetails = (billId) => api.get(`/bills/${billId}`);

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

export const deleteVehicle = (vehicleId) =>
  api.delete(`/vehicles/${vehicleId}`);

// Weekly Reports
export const fetchWeeklyReports = (from, to) =>
  api.get("/weekly-reports", {
    params: { from, to },
  });

export default api;
