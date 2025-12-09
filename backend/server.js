// server.js
import express from "express";
import dotenv from "dotenv";
import materialsRouter from "./routes/materials.js";
import ownersRouter from "./routes/owners.js";
import transactionsRouter from "./routes/transactions.js";
import reportsRouter from "./routes/reports.js";
import billsRouter from "./routes/bills.js";
import ledgerRouter from "./routes/ledger.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// API routes
app.use("/api/materials", materialsRouter);
app.use("/api/owners", ownersRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/bills", billsRouter);
app.use("/api", ledgerRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
