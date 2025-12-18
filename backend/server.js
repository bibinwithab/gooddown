// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import materialsRouter from "./routes/materials.js";
import ownersRouter from "./routes/owners.js";
import transactionsRouter from "./routes/transactions.js";
import reportsRouter from "./routes/reports.js";
import billsRouter from "./routes/bills.js";
import vehiclesRouter from "./routes/vehicles.js";
import ledgerRouter from "./routes/ledger.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
app.use("/api/vehicles", vehiclesRouter);
app.use("/api", ledgerRouter);

// ✅ Serve React build (static files)
const publicPath = path.join(__dirname, "public");
console.log("Serving static files from:", publicPath);

app.use(express.static(publicPath));

// // ✅ React Router fallback – must come AFTER API routes
// app.get("/*", (req, res) => {
//   res.sendFile(path.join(publicPath, "index.html"));
// });

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
