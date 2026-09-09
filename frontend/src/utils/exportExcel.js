import * as XLSX from "xlsx";

function autoWidth(rows, columns) {
  const widths = columns.map((col) => col.header.length);
  rows.forEach((r) => {
    columns.forEach((col, i) => {
      const v = r[col.key] ?? "";
      const len = String(v).length;
      if (len > widths[i]) widths[i] = Math.min(len + 2, 40);
    });
  });
  return widths.map((w) => ({ wch: w }));
}

export function exportToExcel({ filename, sheets }) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows, columns }) => {
    const header = columns.map((c) => c.header);
    const data = rows.map((r) => {
      const obj = {};
      columns.forEach((c) => { obj[c.header] = r[c.key] ?? ""; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data, { header });
    ws["!cols"] = autoWidth(rows, columns);
    // header bold via cell style (best effort, xlsx community may ignore without style extension)
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function formatDateExcel(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("fr-FR"); } catch { return String(v); }
}
