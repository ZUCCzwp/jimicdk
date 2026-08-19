import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, CopySimple, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { api } from "@/api/client";
import type { ShopOrderResp } from "@/api/types";
import { useI18n } from "@/i18n";
import { upsertOrder, upsertPurchase } from "@/lib/storage";
import { Button, Spinner, Surface } from "@heroui/react";
import { useUser } from "@/hooks/useUser";

type ReturnState = "processing" | "success" | "failed";

function pendingCheckout(): { orderNo: string; claim: string } | null {
  try {
    const raw = sessionStorage.getItem("jimicdk.checkout");
    return raw ? (JSON.parse(raw) as { orderNo: string; claim: string }) : null;
  } catch {
    return null;
  }
}

export function ShopReturnPage() {
  const { t, te } = useI18n();
  const { user, refresh } = useUser();
  const [params] = useSearchParams();
  const pending = pendingCheckout();
  const orderNo = params.get("order_no")?.trim() || pending?.orderNo || "";
  const claim = params.get("claim")?.trim() || pending?.claim || "";
  const sessionId = params.get("session_id")?.trim() || "";

  const [state, setState] = useState<ReturnState>(orderNo && claim ? "processing" : "failed");
  const [error, setError] = useState<string | null>(orderNo && claim ? null : t("shop.return.missing"));
  const [order, setOrder] = useState<ShopOrderResp | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderNo || !claim) return;
    let cancelled = false;
    (async () => {
      try {
        const paid = await api.shopConfirm(orderNo, claim, sessionId || undefined);
        if (cancelled) return;
        if (paid.status !== "paid") {
          setState("failed");
          setError(t("shop.return.unpaid"));
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
        // Wallet balance may have been deducted via wallet/Stripe checkout.
        if (user) void refresh();
        sessionStorage.removeItem("jimicdk.checkout");
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setState("failed");
        setError(te(err, "shop.return.failedDesc"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [claim, orderNo, sessionId, t, te]);

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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onPress={() => void copyCodes()}>
              <CopySimple size={18} weight="bold" />
              {copied ? t("shop.return.copied") : t("shop.return.copy")}
            </Button>
            <Link className="button button--secondary" to="/">
              {t("shop.return.redeem")}
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
          <div className="mt-8">
            <Link className="button" to="/shop">
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
    </Surface>
  );
}
