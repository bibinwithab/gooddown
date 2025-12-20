import * as XLSX from "xlsx-js-style";

/**
 * weeklyData = response from backend:
 * {
 *   from,
 *   to,
 *   owners: [
 *     {
 *       owner_name,
 *       entries: [
 *         {
 *           date,
 *           items: [{ material, qty, rate, total }],
 *           day_total,
 *           paid,
 *           balance
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export function exportWeeklyLedgerToExcel(filename, weeklyData) {
  const wb = XLSX.utils.book_new();
  const wsData = [];
  const merges = [];

  let rowIndex = 0;

  weeklyData.owners.forEach((owner) => {
    /** OWNER TITLE */
    wsData.push([owner.owner_name]);
    merges.push({
      s: { r: rowIndex, c: 0 },
      e: { r: rowIndex, c: 6 },
    });
    rowIndex++;

    wsData.push([]); // spacing
    rowIndex++;

    /** TABLE HEADER */
    wsData.push([
      "DATE",
      "MATERIAL",
      "QTY",
      "RATE",
      "AMOUNT",
      "PAID",
      "BALANCE",
    ]);
    const headerRow = rowIndex;
    rowIndex++;

    owner.entries.forEach((entry) => {
      const dateStr = formatDate(entry.date);

      entry.items.forEach((item, idx) => {
        wsData.push([
          idx === 0 ? dateStr : "",
          item.material,
          item.qty ?? "",
          item.rate ?? "",
          item.total ?? "",
          idx === 0 && entry.paid ? entry.paid : "",
          "",
        ]);
        rowIndex++;
      });

      /** DAY TOTAL ROW */
      wsData.push([
        "",
        "TOTAL",
        "",
        "",
        entry.day_total,
        entry.paid || "",
        entry.balance,
      ]);
      rowIndex++;
    });

    wsData.push([]); // space between owners
    rowIndex++;
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = merges;

  /** COLUMN WIDTHS */
  ws["!cols"] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 8 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  /** STYLES */
  for (let r = 0; r < wsData.length; r++) {
    for (let c = 0; c < 7; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;

      // Owner title
      if (wsData[r].length === 1) {
        ws[cellRef].s = {
          font: { sz: 22, bold: true },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // Header
      if (
        wsData[r][0] === "DATE" &&
        wsData[r][1] === "MATERIAL"
      ) {
        ws[cellRef].s = {
          font: { bold: true },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
          },
        };
      }

      // TOTAL ROW
      if (wsData[r][1] === "TOTAL") {
        ws[cellRef].s = {
          font: { bold: true },
          fill: {
            fgColor: { rgb: "FFFDE68A" },
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
          },
        };
      }

      // FINAL BALANCE CELL
      if (c === 6 && wsData[r][1] === "TOTAL") {
        ws[cellRef].s = {
          font: { bold: true },
          fill: {
            fgColor: { rgb: "FFDCFCE7" },
          },
          alignment: { horizontal: "right" },
        };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Weekly Ledger");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** UTIL */
function formatDate(d) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
