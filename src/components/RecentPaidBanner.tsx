import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, CopySimple, X } from "@phosphor-icons/react";
import { Button } from "@heroui/react";
import { useI18n } from "@/i18n";
import {
  dismissLastPaidBanner,
  getLastPaidPurchase,
  getPendingCheckout,
  isLastPaidDismissed,
  onLastPaidChange,
  type StoredPurchase,
} from "@/lib/storage";

export function RecentPaidBanner({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [purchase, setPurchase] = useState<StoredPurchase | null>(() => getLastPaidPurchase());
  const [dismissed, setDismissed] = useState(() => isLastPaidDismissed());
  const [pending, setPending] = useState(() => getPendingCheckout());
  const [copied, setCopied] = useState(false);

  useEffect(
    () =>
      onLastPaidChange(() => {
        setPurchase(getLastPaidPurchase());
        setDismissed(isLastPaidDismissed());
        setPending(getPendingCheckout());
      }),
    [],
  );

  useEffect(() => {
    setPending(getPendingCheckout());
  }, []);

  async function copyCodes(codes: string[]) {
    const text = codes.join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  if (pending?.orderNo && pending.claim) {
    const to = `/shop/return?order_no=${encodeURIComponent(pending.orderNo)}&claim=${encodeURIComponent(pending.claim)}`;
    return (
      <aside
        className={`rounded-2xl border border-accent/40 bg-accent/10 px-4 py-4 sm:px-5 ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <CheckCircle className="mt-0.5 shrink-0 text-accent" size={22} weight="fill" />
            <div>
              <p className="text-sm font-semibold tracking-tight">{t("shop.paidBanner.pendingTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t("shop.paidBanner.pendingDesc")}</p>
            </div>
          </div>
          <Link className="button button--primary shrink-0" to={to}>
            {t("shop.paidBanner.viewCodes")}
          </Link>
        </div>
      </aside>
    );
  }

  if (!purchase || dismissed || purchase.status !== "paid" || !purchase.codes.length) {
    return null;
  }

  const returnTo = `/shop/return?order_no=${encodeURIComponent(purchase.orderNo)}&claim=${encodeURIComponent(purchase.claim)}`;

  return (
    <aside
      className={`rounded-2xl border border-accent/40 bg-accent/10 px-4 py-4 sm:px-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <CheckCircle className="mt-0.5 shrink-0 text-accent" size={22} weight="fill" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">{t("shop.paidBanner.title")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {t("shop.paidBanner.desc", { order: purchase.orderNo })}
            </p>
            <div className="mt-3 space-y-1.5">
              {purchase.codes.map((code) => (
                <p
                  key={code}
                  className="break-all rounded-xl border border-border/70 bg-[color:var(--surface)] px-3 py-2 font-mono text-sm"
                >
                  {code}
                </p>
              ))}
            </div>
          </div>
        </div>
        <button
          aria-label={t("shop.paidBanner.dismiss")}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground"
          type="button"
          onClick={() => dismissLastPaidBanner(purchase.orderNo)}
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="lg" onPress={() => void copyCodes(purchase.codes)}>
          <CopySimple size={16} weight="bold" />
          {copied ? t("shop.return.copied") : t("shop.return.copy")}
        </Button>
        <Link className="button button--secondary" to="/redeem">
          {t("shop.return.redeem")}
        </Link>
        <Link className="button button--ghost" to={returnTo}>
          {t("shop.paidBanner.openReturn")}
        </Link>
        <Link className="button button--ghost" to="/lookup">
          {t("nav.lookup")}
        </Link>
      </div>
    </aside>
  );
}
