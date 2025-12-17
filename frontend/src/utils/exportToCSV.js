// src/utils/exportToCsv.js  (XLSX with styled header)
import * as XLSX from "xlsx-js-style";

// rows: array of objects
// columns: [{ label: "Header Name", key: "field_in_row" }, ...]
// options: { title?: string }
export function exportToCsv(filename, rows, columns, options = {}) {
  if (!rows || rows.length === 0) {
    alert("No data to export");
    return;
  }

  const safeFilename = filename.endsWith(".xlsx")
    ? filename
    : `${filename}.xlsx`;

  const title = options.title || "";

  const wsData = [];

  // 🔹 TITLE ROW (Owner name)
  if (title) {
    wsData.push([title]);
    wsData.push([]); // spacing row
  }

  // 🔹 HEADER ROW
  wsData.push(columns.map((c) => c.label));

  // 🔹 DATA ROWS
  rows.forEach((row) => {
    wsData.push(
      columns.map((col) => {
        let val = row[col.key];

        if (val === null || val === undefined) return "";
        return val;
      })
    );
  });

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // 🔹 Highlight FINAL BALANCE cell (last row, last column)
  const totalRows = wsData.length;
  const totalCol = columns.length;

  // Row index of last data row
  // rows:
  // 0 → title
  // 1 → empty
  // 2 → header
  // 3..n → data
  const lastRowIndex = totalRows - 1;
  const lastColIndex = totalCol - 1;

  // Cell reference (e.g., I10)
  const finalCellRef = XLSX.utils.encode_cell({
    r: lastRowIndex,
    c: lastColIndex,
  });

  const finalBalanceCell = worksheet[finalCellRef];

  if (finalBalanceCell) {
    const balanceValue = Number(finalBalanceCell.v || 0);

    finalBalanceCell.s = {
      font: {
        bold: true,
        sz: 14,
      },
      alignment: {
        horizontal: "right",
        vertical: "center",
      },
      fill: {
        fgColor: {
          rgb: balanceValue >= 0 ? "C6EFCE" : "FFC7CE", // green / red
        },
      },
      border: {
        top: { style: "medium" },
        bottom: { style: "medium" },
        left: { style: "medium" },
        right: { style: "medium" },
      },
    };
  }

  const totalCols = columns.length - 1;

  // 🔹 MERGE TITLE ACROSS COLUMNS
  if (title) {
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols } }];

    // 🔹 STYLE TITLE CELL (A1)
    worksheet["A1"].s = {
      font: {
        sz: 36,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };
  }

  // 🔹 STYLE HEADER ROW
  const headerRowIndex = title ? 2 : 0;
  for (let c = 0; c <= totalCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
        border: {
          bottom: { style: "thin" },
        },
      };
    }
  }

  // 🔹 AUTO COLUMN WIDTH
  worksheet["!cols"] = columns.map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");

  XLSX.writeFile(workbook, safeFilename);
}
