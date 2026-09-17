import {
  COMPANY,
  formatMoney,
  formatMoneyWithCode,
  type ReceiptData,
} from "@/lib/receipt";

/** Minimal PDF writer (Helvetica) — no external deps. Latin-1 only. */
function escapePdf(text: string): string {
  const latin = text.replace(/[^\x20-\x7E]/g, "");
  return latin.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

type PdfOp = string;

export type ReceiptPdfLabels = {
  receipt: string;
  receiptNumber: string;
  datePaid: string;
  billTo: string;
  paidOn: string;
  date: string;
  description: string;
  qty: string;
  unitPrice: string;
  fee: string;
  amount: string;
  subtotal: string;
  total: string;
  amountPaid: string;
  page: string;
};

export function downloadReceiptPdf(data: ReceiptData, labels: ReceiptPdfLabels): void {
  const pageW = 612;
  const pageH = 792;
  const margin = 48;
  const ops: PdfOp[] = [];

  const drawText = (x: number, y: number, size: number, text: string, bold = false) => {
    const font = bold ? "/F2" : "/F1";
    ops.push("BT");
    ops.push(`${font} ${size} Tf`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    ops.push(`(${escapePdf(text)}) Tj`);
    ops.push("ET");
  };

  const drawRight = (rightX: number, y: number, size: number, text: string, bold = false) => {
    const approx = text.length * size * 0.52;
    drawText(rightX - approx, y, size, text, bold);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, width = 0.6) => {
    ops.push(`${width} w`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    ops.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    ops.push("S");
  };

  ops.push("0 0 0 rg");
  ops.push(`0 ${pageH - 8} ${pageW} 8 re`);
  ops.push("f");

  let y = pageH - 52;
  drawText(margin, y, 28, labels.receipt, true);
  drawRight(pageW - margin, y, 22, COMPANY.brand, true);

  y -= 34;
  drawText(margin, y, 10, `${labels.receiptNumber} ${data.receiptNo}`);
  y -= 15;
  drawText(margin, y, 10, `${labels.datePaid} ${data.datePaid}`);

  y -= 36;
  const col2 = pageW / 2 + 8;
  const leftY0 = y;
  drawText(margin, y, 11, COMPANY.website, true);
  drawText(col2, y, 11, labels.billTo, true);

  y -= 15;
  drawText(margin, y, 10, COMPANY.legalName);
  let rightY = leftY0 - 15;
  if (data.billToName) {
    drawText(col2, rightY, 10, data.billToName);
    rightY -= 14;
  }
  if (data.billToEmail) {
    drawText(col2, rightY, 10, data.billToEmail);
  }

  for (const line of COMPANY.addressLines) {
    y -= 14;
    drawText(margin, y, 10, line);
  }
  y -= 14;
  drawText(margin, y, 10, COMPANY.email);

  y -= 34;
  const paidLine = `${formatMoneyWithCode(data.amountCents, data.currency)} ${labels.paidOn} ${data.datePaid}`;
  drawText(margin, y, 14, paidLine, true);

  y -= 26;
  drawLine(margin, y, pageW - margin, y, 0.8);
  y -= 16;

  const cols = {
    date: margin,
    desc: margin + 95,
    qty: margin + 275,
    unit: margin + 310,
    fee: margin + 395,
    amountRight: pageW - margin,
  };

  drawText(cols.date, y, 9, labels.date, true);
  drawText(cols.desc, y, 9, labels.description, true);
  drawText(cols.qty, y, 9, labels.qty, true);
  drawText(cols.unit, y, 9, labels.unitPrice, true);
  drawText(cols.fee, y, 9, labels.fee, true);
  drawRight(cols.amountRight, y, 9, labels.amount, true);

  y -= 8;
  drawLine(margin, y, pageW - margin, y, 0.5);
  y -= 16;

  for (const line of data.lines) {
    drawText(cols.date, y, 10, line.date);
    drawText(cols.desc, y, 10, line.description.slice(0, 30));
    drawText(cols.qty, y, 10, String(line.qty));
    drawText(cols.unit, y, 10, formatMoney(line.unitCents, data.currency));
    drawText(cols.fee, y, 10, formatMoney(line.feeCents, data.currency));
    drawRight(cols.amountRight, y, 10, formatMoney(line.amountCents, data.currency));
    y -= 18;
  }

  y -= 10;
  const totalsLabelX = pageW - margin - 170;
  const row = (label: string, value: string, bold = false) => {
    drawText(totalsLabelX, y, 10, label, bold);
    drawRight(pageW - margin, y, 10, value, bold);
    y -= 16;
  };
  row(labels.subtotal, formatMoney(data.amountCents, data.currency));
  row(labels.total, formatMoney(data.amountCents, data.currency));
  row(labels.amountPaid, formatMoneyWithCode(data.amountCents, data.currency), true);

  const footY = 42;
  drawLine(margin, footY + 14, pageW - margin, footY + 14, 0.5);
  drawText(margin, footY, 9, `${data.receiptNo} · ${formatMoney(data.amountCents, data.currency)}`);
  drawRight(pageW - margin, footY, 9, labels.page);

  const content = ops.join("\n");
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>endobj\n`,
  );
  objects.push(`4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj\n`);
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");
  objects.push("6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${data.receiptNo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
