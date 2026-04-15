// utils/csv_utils.js
// CSV 读写工具函数

import fs from "fs";

export function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\r") {
      continue;
    } else if (ch === "\n") {
      row.push(value);
      if (row.some(cell => String(cell || "").trim() !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  
  const header = rows[0].map((key, index) => 
    index === 0 ? String(key || "").replace(/^\uFEFF/, "") : String(key || "")
  );

  return rows.slice(1)
    .filter(r => r.some(cell => String(cell || "").trim() !== ""))
    .map(r => {
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = r[index] ?? "";
      });
      return obj;
    });
}

export function writeCsv(filePath, rows, fieldnames) {
  const escapeCell = (value) => {
    const text = value == null ? "" : String(value);
    if (/[",\r\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  const lines = [];
  lines.push(fieldnames.map(escapeCell).join(","));
  
  for (const row of rows) {
    lines.push(fieldnames.map((name) => escapeCell(row[name] ?? "")).join(","));
  }
  
  fs.writeFileSync(filePath, "\ufeff" + lines.join("\r\n") + "\r\n", "utf8");
}

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
