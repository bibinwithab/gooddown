import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_DIR = path.join(__dirname, "../pdfs");

// Ensure PDF directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

export const generateBillPDF = async (billData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        bill_id,
        daily_bill_no,
        bill_timestamp,
        owner_name,
        vehicle_number,
        items,
        total_amount,
        include_pass,
      } = billData;

      const filename = `bill_${bill_id}_${daily_bill_no}.pdf`;
      const filepath = path.join(PDF_DIR, filename);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("BILL", { align: "center" });

      doc.fontSize(10).font("Helvetica").text(" ", { align: "center" });

      // Bill Info
      doc.fontSize(10).font("Helvetica");
      doc.text(`Bill No: ${daily_bill_no}`, 50, 100);
      doc.text(
        `Date: ${new Date(bill_timestamp).toLocaleDateString("en-IN")}`,
        50,
        120
      );
      doc.text(" ");

      // Customer Info
      doc.font("Helvetica-Bold").fontSize(11).text("Customer Details:");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Name: ${owner_name}`, 50);
      doc.text(`Vehicle: ${vehicle_number}`);
      doc.text(" ");

      // Items Table
      doc.font("Helvetica-Bold").fontSize(10).text("Items:");
      const tableTop = doc.y + 10;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 450;

      doc.fontSize(9);
      doc.text("Material", col1, tableTop);
      doc.text("Mattam/Qty", col2, tableTop);
      doc.text("Rate", col3, tableTop);
      doc.text("Total", col4, tableTop);

      // Draw line
      doc
        .moveTo(col1, tableTop + 15)
        .lineTo(500, tableTop + 15)
        .stroke();

      let yPos = tableTop + 25;
      let totalAmount = 0;

      if (items && items.length > 0) {
        items.forEach((item) => {
          const itemTotal = Number(item.total_cost) || 0;
          const rate = Number(item.rate_at_sale) || 0;
          totalAmount += itemTotal;

          // Helper function to get mattam display
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
              return String(Math.round(Number(item.quantity) || 0));
            }

            // Handle grill mattam
            if (item.grill_mattam) {
              if (item.mattam) {
                return `Grill Mattam + ${item.mattam}`;
              } else {
                return "Grill Mattam";
              }
            }

            // Handle regular mattam checkbox
            if (item.mattam_checked) {
              if (item.mattam) {
                return `Mattam + ${item.mattam}`;
              } else {
                return "Mattam";
              }
            }

            // Handle mattam with number
            const mattamStr = item.mattam ? String(item.mattam).trim() : "";

            if (mattamStr === "") {
              return "Mattam";
            }

            const mattamNum = Number(mattamStr);
            if (Number.isFinite(mattamNum)) {
              if (mattamNum === 0)
                return String(Math.round(Number(item.quantity) || 0));
              return "Mattam + " + `${Math.round(mattamNum)}`;
            }

            return mattamStr;
          };

          doc.text(item.material_name?.substring(0, 20), col1, yPos);
          doc.text(getMattamDisplay(), col2, yPos);
          doc.text(`₹${rate.toFixed(2)}`, col3, yPos);
          doc.text(`₹${itemTotal.toFixed(2)}`, col4, yPos);

          yPos += 20;
        });
      }

      // Draw line
      doc.moveTo(col1, yPos).lineTo(500, yPos).stroke();

      yPos += 10;

      // Pass Charge
      if (include_pass) {
        doc.text("Pass Charge", col1, yPos);
        doc.text("₹200.00", col4, yPos, { align: "right" });
        totalAmount += 200;
        yPos += 20;
      }

      // Total
      doc.font("Helvetica-Bold").fontSize(11);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, col1, yPos + 10);

      doc.end();

      stream.on("finish", () => {
        resolve({
          filename,
          filepath,
          success: true,
        });
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const getPDFPath = (filename) => {
  return path.join(PDF_DIR, filename);
};

export const getPDFsDirectory = () => {
  return PDF_DIR;
};
