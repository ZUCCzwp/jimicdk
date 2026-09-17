import { useEffect, useId, useRef } from "react";
import { DownloadSimple, Printer, X } from "@phosphor-icons/react";
import { Button } from "@heroui/react";
import { useI18n } from "@/i18n";
import {
  COMPANY,
  formatMoney,
  formatMoneyWithCode,
  type ReceiptData,
} from "@/lib/receipt";
import { downloadReceiptPdf } from "@/lib/receiptPdf";

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

  function onPrint() {
    const node = printRef.current;
    if (!node) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
    if (!win) return;
    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><title>${data.receiptNo}</title>
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
    // Fallback if onload already fired
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* ignore */
      }
    }, 250);
  }

  function onDownload() {
    downloadReceiptPdf(data, {
      receipt: t("receipt.title"),
      receiptNumber: t("receipt.number"),
      datePaid: t("receipt.datePaid"),
      billTo: t("receipt.billTo"),
      paidOn: t("receipt.paidOn"),
      date: t("receipt.col.date"),
      description: t("receipt.col.description"),
      qty: t("receipt.col.qty"),
      unitPrice: t("receipt.col.unitPrice"),
      fee: t("receipt.col.fee"),
      amount: t("receipt.col.amount"),
      subtotal: t("receipt.subtotal"),
      total: t("receipt.total"),
      amountPaid: t("receipt.amountPaid"),
      page: t("receipt.page"),
    });
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
            {t("receipt.title")}
          </h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onPress={onPrint}>
              <Printer size={16} weight="bold" />
              {t("receipt.print")}
            </Button>
            <Button size="sm" onPress={onDownload}>
              <DownloadSimple size={16} weight="bold" />
              {t("receipt.downloadPdf")}
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

        <div className="overflow-auto bg-neutral-100 p-3 sm:p-6">
          <div ref={printRef} className="mx-auto max-w-[720px] bg-white px-6 py-8 sm:px-10 sm:py-10">
            <ReceiptDocument data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const { t } = useI18n();
  return (
    <>
      <div className="bar -mx-6 mb-6 h-1.5 bg-black sm:-mx-10" />
      <div className="head flex items-start justify-between gap-6">
        <div>
          <h1 className="title m-0 text-3xl font-bold tracking-tight sm:text-4xl">{t("receipt.title")}</h1>
          <p className="meta mt-3 text-sm leading-relaxed text-neutral-800">
            <span className="block">
              {t("receipt.number")} {data.receiptNo}
            </span>
            <span className="block">
              {t("receipt.datePaid")} {data.datePaid}
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
          <strong className="block font-semibold">{t("receipt.billTo")}</strong>
          {data.billToName ? <p className="m-0 mt-1">{data.billToName}</p> : null}
          {data.billToEmail ? <p className="m-0">{data.billToEmail}</p> : null}
          {!data.billToName && !data.billToEmail ? <p className="m-0 mt-1 text-neutral-500">—</p> : null}
        </div>
      </div>

      <p className="paid mt-8 text-lg font-bold">
        {formatMoneyWithCode(data.amountCents, data.currency)} {t("receipt.paidOn")} {data.datePaid}
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-t border-b border-neutral-300 py-2.5 pr-2 text-left font-semibold">{t("receipt.col.date")}</th>
            <th className="border-t border-b border-neutral-300 py-2.5 pr-2 text-left font-semibold">
              {t("receipt.col.description")}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {t("receipt.col.qty")}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {t("receipt.col.unitPrice")}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 px-2 text-right font-semibold">
              {t("receipt.col.fee")}
            </th>
            <th className="num border-t border-b border-neutral-300 py-2.5 pl-2 text-right font-semibold">
              {t("receipt.col.amount")}
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
          <span>{t("receipt.subtotal")}</span>
          <span>{formatMoney(data.amountCents, data.currency)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{t("receipt.total")}</span>
          <span>{formatMoney(data.amountCents, data.currency)}</span>
        </div>
        <div className="paid-row flex justify-between py-1 font-bold">
          <span>{t("receipt.amountPaid")}</span>
          <span>{formatMoneyWithCode(data.amountCents, data.currency)}</span>
        </div>
      </div>

      <div className="foot mt-12 flex justify-between border-t border-neutral-200 pt-3 text-xs text-neutral-600">
        <span>
          {data.receiptNo} · {formatMoney(data.amountCents, data.currency)}
        </span>
        <span>{t("receipt.page")}</span>
      </div>
    </>
  );
}
