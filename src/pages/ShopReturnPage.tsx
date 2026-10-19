import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, CopySimple, Receipt, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { api } from "@/api/client";
import type { ShopOrderResp } from "@/api/types";
import { OrderReceiptModal } from "@/components/OrderReceipt";
import { useI18n } from "@/i18n";
import { receiptFromShopOrder, type ReceiptData } from "@/lib/receipt";
import {
  getLastPaidPurchase,
  getPendingCheckout,
  upsertOrder,
  upsertPurchase,
  type StoredPurchase,
} from "@/lib/storage";
import { Button, Spinner, Surface } from "@heroui/react";
import { useUser } from "@/hooks/useUser";

type ReturnState = "processing" | "success" | "failed";

function purchaseToOrder(purchase: StoredPurchase): ShopOrderResp {
  return {
    order_no: purchase.orderNo,
    claim: purchase.claim,
    product_slug: purchase.productSlug,
    plan_type: "",
    quantity: purchase.codes.length || 1,
    codes: purchase.codes,
    amount_cents: purchase.amountCents,
    currency: purchase.currency,
    status: purchase.status,
    paid_at: purchase.paidAt,
    created_at: purchase.paidAt,
  };
}

export function ShopReturnPage() {
  const { t, te } = useI18n();
  const { user, refresh } = useUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pending = getPendingCheckout();
  const cached = useMemo(() => getLastPaidPurchase(), []);

  const orderNo = params.get("order_no")?.trim() || pending?.orderNo || cached?.orderNo || "";
  const claim = params.get("claim")?.trim() || pending?.claim || cached?.claim || "";
  const sessionId = params.get("session_id")?.trim() || "";
  const fromCacheOnly = !params.get("order_no") && !pending && Boolean(cached?.orderNo);

  const [state, setState] = useState<ReturnState>(() => {
    if (orderNo && claim) return "processing";
    if (cached?.codes?.length) return "success";
    return "failed";
  });
  const [error, setError] = useState<string | null>(() =>
    orderNo && claim ? null : cached?.codes?.length ? null : t("shop.return.missing"),
  );
  const [order, setOrder] = useState<ShopOrderResp | null>(() =>
    !orderNo && cached?.codes?.length ? purchaseToOrder(cached) : null,
  );
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (!orderNo || !claim) {
      if (cached?.codes?.length) {
        setOrder(purchaseToOrder(cached));
        setState("success");
        setError(null);
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const paid = fromCacheOnly
          ? await api.shopOrder(orderNo, claim).catch(() => null)
          : await api.shopConfirm(orderNo, claim, sessionId || undefined);

        if (cancelled) return;

        if (!paid || paid.status !== "paid") {
          if (cached && cached.orderNo === orderNo && cached.codes.length) {
            setOrder(purchaseToOrder(cached));
            setState("success");
            setError(null);
            return;
          }
          setState("failed");
          setError(paid ? t("shop.return.unpaid") : t("shop.return.failedDesc"));
          return;
        }

        setOrder(paid);
        upsertPurchase({
          orderNo: paid.order_no,
          claim: paid.claim,
          productSlug: paid.product_slug,
          codes: paid.codes ?? [],
          amountCents: paid.amount_cents,
          currency: paid.currency,
          status: paid.status,
          paidAt: paid.paid_at || paid.created_at,
        });
        for (const code of paid.codes ?? []) {
          upsertOrder({ cdkCode: code, addedAt: new Date().toISOString() });
        }
        if (user) void refresh();
        sessionStorage.removeItem("jimicdk.checkout");
        setState("success");

        const urlOrder = params.get("order_no");
        const urlClaim = params.get("claim");
        if (urlOrder !== paid.order_no || (paid.claim && urlClaim !== paid.claim)) {
          const next = new URLSearchParams();
          next.set("order_no", paid.order_no);
          if (paid.claim) next.set("claim", paid.claim);
          navigate(`/shop/return?${next.toString()}`, { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        if (cached && cached.orderNo === orderNo && cached.codes.length) {
          setOrder(purchaseToOrder(cached));
          setState("success");
          setError(null);
          return;
        }
        setState("failed");
        setError(te(err, "shop.return.failedDesc"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally omit user/refresh — only confirm once per checkout identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim, orderNo, sessionId, fromCacheOnly, t, te]);

  async function copyCodes() {
    const text = (order?.codes ?? []).join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Surface className="mx-auto w-full max-w-lg rounded-3xl p-8 text-center md:p-10">
      {state === "processing" && (
        <>
          <SpinnerGap className="mx-auto animate-spin text-accent" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("shop.return.processingTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("shop.return.processingDesc")}</p>
        </>
      )}

      {state === "success" && order && (
        <>
          <CheckCircle className="mx-auto text-accent" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("shop.return.successTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("shop.return.successDesc")}</p>
          <p className="mt-3 text-sm text-muted">{t("shop.return.saveHint")}</p>
          <p className="mt-4 font-mono text-sm text-muted">{order.order_no}</p>
          {order.claim ? (
            <p className="mt-2 text-sm text-muted">
              {t("shop.claim")}：<span className="font-mono text-foreground">{order.claim}</span>
            </p>
          ) : null}
          <div className="mt-6 space-y-2 text-left">
            {(order.codes ?? []).map((code) => (
              <p key={code} className="break-all rounded-2xl border border-border/80 px-4 py-3 font-mono text-sm">
                {code}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button size="lg" onPress={() => void copyCodes()}>
              <CopySimple size={18} weight="bold" />
              {copied ? t("shop.return.copied") : t("shop.return.copy")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onPress={() =>
                setReceipt(
                  receiptFromShopOrder(order, {
                    billToName: user?.display_name || user?.username,
                    billToEmail: order.email || user?.email,
                  }),
                )
              }
            >
              <Receipt size={18} weight="bold" />
              {t("receipt.view")}
            </Button>
            <Link className="button button--secondary" to="/redeem">
              {t("shop.return.redeem")}
            </Link>
            <Link className="button button--ghost" to="/lookup">
              {t("nav.lookup")}
            </Link>
            <Link className="button button--ghost" to="/shop">
              {t("shop.return.back")}
            </Link>
          </div>
        </>
      )}

      {state === "failed" && (
        <>
          <WarningCircle className="mx-auto text-danger" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("shop.return.failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{error || t("shop.return.failedDesc")}</p>
          <p className="mt-3 text-sm text-muted">{t("shop.return.recoverHint")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="button" to="/lookup">
              {t("nav.lookup")}
            </Link>
            <Link className="button button--ghost" to="/shop">
              {t("shop.return.back")}
            </Link>
          </div>
        </>
      )}

      {state === "processing" && (
        <div className="mt-8 flex justify-center">
          <Spinner size="sm" />
        </div>
      )}

      {receipt ? (
        <OrderReceiptModal
          data={receipt}
          open
          onClose={() => setReceipt(null)}
          onFinalized={(next) => {
            setReceipt(next);
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    bill_to_name: next.billToName,
                    bill_to_email: next.billToEmail,
                    receipt_downloaded_at: new Date().toISOString(),
                  }
                : prev,
            );
          }}
        />
      ) : null}
    </Surface>
  );
}
