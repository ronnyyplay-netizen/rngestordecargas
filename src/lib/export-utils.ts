import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { Expense } from "@/hooks/use-store";

export function exportToPDF(expenses: Expense[], title: string) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);

  const rows = expenses.map((e) => [
    e.description,
    e.category,
    new Date(e.date).toLocaleDateString("pt-BR"),
    `R$ ${e.amount.toFixed(2)}`,
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  rows.push(["", "", "TOTAL", `R$ ${total.toFixed(2)}`]);

  autoTable(doc, {
    startY: 36,
    head: [["Descrição", "Categoria", "Data", "Valor"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [30, 48, 80] },
  });

  doc.save(`${title.replace(/\s/g, "_")}.pdf`);
}

export async function exportToExcel(expenses: Expense[], title: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Despesas");

  sheet.columns = [
    { header: "Descrição", key: "description", width: 30 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Data", key: "date", width: 14 },
    { header: "Valor", key: "amount", width: 14 },
  ];

  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3050" } };

  expenses.forEach((e) => {
    sheet.addRow({
      description: e.description,
      category: e.category,
      date: new Date(e.date).toLocaleDateString("pt-BR"),
      amount: e.amount,
    });
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRow = sheet.addRow({ description: "", category: "", date: "TOTAL", amount: total });
  totalRow.font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${title.replace(/\s/g, "_")}.xlsx`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportToDoc(expenses: Expense[], title: string) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const safeTitle = escapeHtml(title);
  let html = `<html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>`;
  html += `<h1>${safeTitle}</h1><p>Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>`;
  html += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">`;
  html += `<tr style="background:#1e3050;color:#fff"><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th></tr>`;
  expenses.forEach((e) => {
    html += `<tr><td>${escapeHtml(e.description)}</td><td>${escapeHtml(e.category)}</td><td>${new Date(e.date).toLocaleDateString("pt-BR")}</td><td>R$ ${e.amount.toFixed(2)}</td></tr>`;
  });
  html += `<tr><td colspan="3"><strong>TOTAL</strong></td><td><strong>R$ ${total.toFixed(2)}</strong></td></tr>`;
  html += `</table></body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  saveAs(blob, `${title.replace(/\s/g, "_")}.doc`);
}
