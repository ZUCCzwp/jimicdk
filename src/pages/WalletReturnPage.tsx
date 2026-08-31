import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n";
import { Spinner, Surface } from "@heroui/react";
import { useUser } from "@/hooks/useUser";

type ReturnState = "processing" | "success" | "failed";

export function WalletReturnPage() {
  const { t, te } = useI18n();
  const { user, refresh, session, applyAuth } = useUser();
  const [params] = useSearchParams();
  const orderNo = params.get("order_no")?.trim() || "";
  const sessionId = params.get("session_id")?.trim() || "";

  const [state, setState] = useState<ReturnState>(orderNo ? "processing" : "failed");
  const [error, setError] = useState<string | null>(orderNo ? null : t("wallet.return.missing"));
  const [balanceCents, setBalanceCents] = useState<number | null>(null);

  useEffect(() => {
    if (!orderNo) return;
    let cancelled = false;
    (async () => {
      try {
        const paid = await api.userWalletConfirm(orderNo, sessionId || undefined);
        if (cancelled) return;
        if (!paid.credited || paid.status !== "paid") {
          setState("failed");
          setError(t("wallet.return.unpaid"));
          return;
        }
        setBalanceCents(paid.balance_cents);
        if (user && session) {
          applyAuth(session.token, session.expiresAt, {
            ...user,
            wallet_cents: paid.balance_cents,
          });
        }
        void refresh();
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setState("failed");
        setError(te(err, "wallet.return.failedDesc"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNo, sessionId, t, te, user, session, applyAuth, refresh]);

  return (
    <Surface className="mx-auto w-full max-w-lg rounded-3xl p-8 text-center md:p-10">
      {state === "processing" && (
        <>
          <SpinnerGap className="mx-auto animate-spin text-accent" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("wallet.return.processingTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("wallet.return.processingDesc")}</p>
          <div className="mt-8 flex justify-center">
            <Spinner size="sm" />
          </div>
        </>
      )}

      {state === "success" && (
        <>
          <CheckCircle className="mx-auto text-accent" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("wallet.return.successTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("wallet.return.successDesc")}</p>
          {balanceCents != null ? (
            <p className="mt-4 text-3xl font-semibold tracking-tight">
              ${(balanceCents / 100).toFixed(2)}
            </p>
          ) : null}
          <p className="mt-2 font-mono text-sm text-muted">{orderNo}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="button" to="/account">
              {t("wallet.return.back")}
            </Link>
            <Link className="button button--secondary" to="/shop">
              {t("wallet.return.shop")}
            </Link>
          </div>
        </>
      )}

      {state === "failed" && (
        <>
          <WarningCircle className="mx-auto text-danger" size={48} weight="bold" />
          <h1 className="mt-6 text-2xl font-semibold">{t("wallet.return.failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{error || t("wallet.return.failedDesc")}</p>
          <div className="mt-8">
            <Link className="button" to="/account">
              {t("wallet.return.back")}
            </Link>
          </div>
        </>
      )}
    </Surface>
  );
}
