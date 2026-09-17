import type { ShopOrderLine, ShopOrderResp } from "@/api/types";
import { COMPANY } from "@/lib/company";
import type { StoredPurchase } from "@/lib/storage";

export type ReceiptLine = {
  date: string;
  description: string;
  qty: number;
  unitCents: number;
  feeCents: number;
  amountCents: number;
};

export type ReceiptData = {
  receiptNo: string;
  datePaid: string;
  currency: string;
  amountCents: number;
  billToName?: string;
  billToEmail?: string;
  lines: ReceiptLine[];
};

function money(cents: number, currency = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  const amount = (cents / 100).toFixed(2);
  return code === "USD" ? `$${amount}` : `${amount} ${code}`;
}

/** e.g. May 27, 2026 */
export function formatReceiptDate(raw: string, locale: "zh" | "en" = "en"): string {
  const trimmed = raw.trim();
  if (!trimmed) return "—";
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const fallback = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return fallback.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return trimmed;
  }
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMoney(cents: number, currency = "USD"): string {
  return money(cents, currency);
}

export function formatMoneyWithCode(cents: number, currency = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  return `${money(cents, currency)} ${code}`;
}

function linesFromOrder(order: ShopOrderResp, dateLabel: string): ReceiptLine[] {
  const items: ShopOrderLine[] =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            product_id: 0,
            product_slug: order.product_slug,
            plan_type: order.plan_type,
            quantity: order.quantity || 1,
            amount_cents: order.amount_cents,
          },
        ];

  return items.map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const amountCents = item.amount_cents;
    return {
      date: dateLabel,
      description: item.product_slug || order.product_slug,
      qty,
      unitCents: Math.round(amountCents / qty),
      feeCents: 0,
      amountCents,
    };
  });
}

export function receiptFromShopOrder(
  order: ShopOrderResp,
  opts?: { billToName?: string; billToEmail?: string; locale?: "zh" | "en" },
): ReceiptData {
  const paidRaw = order.paid_at || order.created_at;
  const datePaid = formatReceiptDate(paidRaw, opts?.locale ?? "en");
  return {
    receiptNo: order.order_no,
    datePaid,
    currency: order.currency || "USD",
    amountCents: order.amount_cents,
    billToName: opts?.billToName,
    billToEmail: opts?.billToEmail || order.email,
    lines: linesFromOrder(order, datePaid),
  };
}

export function receiptFromPurchase(
  purchase: StoredPurchase,
  opts?: { billToName?: string; billToEmail?: string; locale?: "zh" | "en" },
): ReceiptData {
  const datePaid = formatReceiptDate(purchase.paidAt, opts?.locale ?? "en");
  const qty = 1;
  return {
    receiptNo: purchase.orderNo,
    datePaid,
    currency: purchase.currency || "USD",
    amountCents: purchase.amountCents,
    billToName: opts?.billToName,
    billToEmail: opts?.billToEmail,
    lines: [
      {
        date: datePaid,
        description: purchase.productSlug,
        qty,
        unitCents: purchase.amountCents,
        feeCents: 0,
        amountCents: purchase.amountCents,
      },
    ],
  };
}

export { COMPANY };
