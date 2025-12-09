// src/utils/exportToCsv.js  (now actually exports XLSX)
import * as XLSX from "xlsx";

// rows: array of objects
// columns: [{ label: "Header Name", key: "field_in_row" }, ...]
export function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) {
    alert("No data to export");
    return;
  }

  // Ensure .xlsx extension
  const safeFilename = filename.endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  // Build an array of objects where keys are the column labels
  // This controls the column order and header names in Excel
  const exportRows = rows.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      let val = row[col.key];

      if (val instanceof Date) {
        // Excel is happier with ISO strings or JS Date objects
        val = val.toISOString();
      }

      if (val === null || val === undefined) {
        val = "";
      }

      obj[col.label] = val;
    });
    return obj;
  });

  // Create a worksheet from JSON
  const headerOrder = columns.map((c) => c.label);
  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: headerOrder });

  // Create a workbook and append the sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Trigger download as .xlsx
  XLSX.writeFile(workbook, safeFilename);
}
