import { useEffect, useId, useRef, useState } from "react";
import { DownloadSimple, Printer, X } from "@phosphor-icons/react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { useI18n } from "@/i18n";
import {
  COMPANY,
  RECEIPT_EN,
  formatMoney,
  formatMoneyWithCode,
  type ReceiptData,
} from "@/lib/receipt";
import { downloadReceiptPdf } from "@/lib/receiptPdf";
import { finalizeReceipt, getFinalizedReceipt } from "@/lib/storage";

type Props = {
  data: ReceiptData;
  open: boolean;
  onClose: () => void;
};

export function OrderReceiptModal({ data, open, onClose }: Props) {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [billToName, setBillToName] = useState(data.billToName ?? "");
  const [billToEmail, setBillToEmail] = useState(data.billToEmail ?? "");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = getFinalizedReceipt(data.receiptNo);
    if (saved) {
      setBillToName(saved.billToName);
      setBillToEmail(saved.billToEmail);
      setLocked(true);
      return;
    }
    setBillToName(data.billToName ?? "");
    setBillToEmail(data.billToEmail ?? "");
    setLocked(false);
  }, [open, data.billToName, data.billToEmail, data.receiptNo]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const receipt: ReceiptData = {
    ...data,
    billToName: billToName.trim() || undefined,
    billToEmail: billToEmail.trim() || undefined,
  };

  function onPrint() {
    const node = printRef.current;
    if (!node) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
    if (!win) return;
    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><title>${receipt.receiptNo}</title>
<style>
  @page { margin: 16mm; size: letter; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Helvetica, Arial, sans-serif; color: #111; background: #fff; }
  .bar { height: 6px; background: #000; margin: -16mm -16mm 24px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .title { font-size: 32px; font-weight: 700; margin: 0 0 12px; }
  .meta { font-size: 13px; line-height: 1.6; margin: 0; }
  .brand { font-size: 28px; font-weight: 700; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; font-size: 13px; line-height: 1.55; }
  .parties strong { display: block; margin-bottom: 4px; }
  .paid { font-size: 18px; font-weight: 700; margin: 28px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; border-top: 1px solid #111; border-bottom: 1px solid #ddd; padding: 10px 6px; font-weight: 700; }
  thead th.num, tbody td.num { text-align: right; }
  tbody td { padding: 12px 6px; vertical-align: top; }
  .totals { margin-top: 20px; margin-left: auto; width: 240px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .paid-row { font-weight: 700; margin-top: 4px; }
  .foot { display: flex; justify-content: space-between; border-top: 1px solid #ddd; margin-top: 48px; padding-top: 12px; font-size: 12px; color: #444; }
</style></head><body>${node.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
    };
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* ignore */
      }
    }, 250);
  }

  function onDownload() {
    if (locked) return;
    downloadReceiptPdf(receipt, {
      receipt: RECEIPT_EN.title,
      receiptNumber: RECEIPT_EN.number,
      datePaid: RECEIPT_EN.datePaid,
      billTo: RECEIPT_EN.billTo,
      paidOn: RECEIPT_EN.paidOn,
      date: RECEIPT_EN.date,
      description: RECEIPT_EN.description,
      qty: RECEIPT_EN.qty,
      unitPrice: RECEIPT_EN.unitPrice,
      fee: RECEIPT_EN.fee,
      amount: RECEIPT_EN.amount,
      subtotal: RECEIPT_EN.subtotal,
      total: RECEIPT_EN.total,
      amountPaid: RECEIPT_EN.amountPaid,
      page: RECEIPT_EN.page,
    });
    finalizeReceipt({
      orderNo: data.receiptNo,
      billToName: billToName.trim(),
      billToEmail: billToEmail.trim(),
    });
    setLocked(true);
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-black shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-semibold text-neutral-900">
            {RECEIPT_EN.title}
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onPress={onPrint}>
              <Printer size={16} weight="bold" />
              Print
            </Button>
            <Button isDisabled={locked} size="sm" onPress={onDownload}>
              <DownloadSimple size={16} weight="bold" />
              {locked ? "Downloaded" : "Download PDF"}
            </Button>
            <button
              aria-label={t("receipt.close")}
              className="ml-1 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              type="button"
              onClick={onClose}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5">
          <p className="mb-2 text-xs font-medium text-neutral-600">
            {locked ? t("receipt.billToLocked") : t("receipt.billToEdit")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField fullWidth isDisabled={locked} name="billToName" value={billToName} onChange={setBillToName}>
              <Label>{t("receipt.billToCompany")}</Label>
              <Input disabled={locked} placeholder={t("receipt.billToCompanyHint")} variant="secondary" />
            </TextField>
            <TextField fullWidth isDisabled={locked} name="billToEmail" value={billToEmail} onChange={setBillToEmail}>
              <Label>{t("receipt.billToEmail")}</Label>
              <Input
                disabled={locked}
                inputMode="email"
                placeholder={t("receipt.billToEmailHint")}
                type="email"
                variant="secondary"
              />
            </TextField>
          </div>
        </div>

        <div className="overflow-auto bg-neutral-100 p-3 sm:p-6">
          <div ref={printRef} className="mx-auto max-w-[720px] bg-white px-6 py-8 sm:px-10 sm:py-10">
            <ReceiptDocument data={receipt} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <>
      <div className="bar -mx-6 mb-6 h-1.5 bg-black sm:-mx-10" />
      <div className="head flex items-start justify-between gap-6">
        <div>
          <h1 className="title m-0 text-3xl font-bold tracking-tight sm:text-4xl">{RECEIPT_EN.title}</h1>
          <p className="meta mt-3 text-sm leading-relaxed text-neutral-800">
            <span className="block">
              {RECEIPT_EN.number} {data.receiptNo}
            </span>
            <span className="block">
              {RECEIPT_EN.datePaid} {data.datePaid}
            </span>
          </p>
        </div>
        <p className="brand m-0 text-2xl font-bold tracking-tight sm:text-3xl">{COMPANY.brand}</p>
      </div>

      <div className="parties mt-8 grid gap-6 text-sm leading-relaxed sm:grid-cols-2">
        <div>
          <strong className="block font-semibold">{COMPANY.website}</strong>
          <p className="m-0 mt-1">{COMPANY.legalName}</p>
          {COMPANY.addressLines.map((line) => (
            <p key={line} className="m-0">
              {line}
            </p>
          ))}
          <p className="m-0">{COMPANY.email}</p>
        </div>
        <div>
          <strong className="block font-semibold">{RECEIPT_EN.billTo}</strong>
          {data.billToName ? <p className="m-0 mt-1">{data.billToName}</p> : null}
          {data.billToEmail ? <p className="m-0">{data.billToEmail}</p> : null}
          {!data.billToName && !data.billToEmail ? <p className="m-0 mt-1 text-neutral-500">—</p> : null}
        </div>
      </div>

      <p className="paid mt-8 text-lg font-bold">
        {formatMoneyWithCode(data.amountCents, data.currency)} {RECEIPT_EN.paidOn} {data.datePaid}
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-t border-b border-neutral-300 py-2.5 pr-2 text-left font-semibold">{RECEIPT_EN.date}</th>
            <th className="border-t border-b border-neutral-300 py-2.5 pr-2 text-left font-semibold">
              {RECEIPT_EN.description}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {RECEIPT_EN.qty}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {RECEIPT_EN.unitPrice}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {RECEIPT_EN.fee}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 pl-2 text-right font-semibold">
              {RECEIPT_EN.amount}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line, i) => (
            <tr key={`${line.description}-${i}`}>
              <td className="py-3 pr-2 align-top whitespace-nowrap">{line.date}</td>
              <td className="py-3 pr-2 align-top">{line.description}</td>
              <td className="num py-3 px-2 align-top text-right">{line.qty}</td>
              <td className="num py-3 px-2 align-top text-right">{formatMoney(line.unitCents, data.currency)}</td>
              <td className="num py-3 px-2 align-top text-right">{formatMoney(line.feeCents, data.currency)}</td>
              <td className="num py-3 pl-2 align-top text-right">{formatMoney(line.amountCents, data.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals ml-auto mt-5 w-56 text-sm">
        <div className="flex justify-between py-1">
          <span>{RECEIPT_EN.subtotal}</span>
          <span>{formatMoney(data.amountCents, data.currency)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{RECEIPT_EN.total}</span>
          <span>{formatMoney(data.amountCents, data.currency)}</span>
        </div>
        <div className="paid-row flex justify-between py-1 font-bold">
          <span>{RECEIPT_EN.amountPaid}</span>
          <span>{formatMoneyWithCode(data.amountCents, data.currency)}</span>
        </div>
      </div>

      <div className="foot mt-12 flex justify-between border-t border-neutral-200 pt-3 text-xs text-neutral-600">
        <span>
          {data.receiptNo} · {formatMoney(data.amountCents, data.currency)}
        </span>
        <span>{RECEIPT_EN.page}</span>
      </div>
    </>
  );
}
