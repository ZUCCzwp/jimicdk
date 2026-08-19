import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { api } from "@/api/client";
import type { ShopOrderResp } from "@/api/types";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import { getPurchases, upsertOrder, upsertPurchase, type StoredPurchase } from "@/lib/storage";
import { Alert, Button, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function rememberOrder(order: ShopOrderResp) {
  upsertPurchase({
    orderNo: order.order_no,
    claim: order.claim,
    productSlug: order.items?.map((item) => item.product_slug).join(" + ") || order.product_slug,
    codes: order.codes ?? [],
    amountCents: order.amount_cents,
    currency: order.currency,
    status: order.status,
    paidAt: order.paid_at || order.created_at,
  });
  for (const code of order.codes ?? []) {
    upsertOrder({ cdkCode: code, addedAt: new Date().toISOString() });
  }
}

export function LookupPage() {
  const { t, te } = useI18n();
  const { user } = useUser();
  const [mine, setMine] = useState<ShopOrderResp[]>([]);
  const [localPurchases, setLocalPurchases] = useState<StoredPurchase[]>(() => getPurchases());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupNo, setLookupNo] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupClaim, setLookupClaim] = useState("");
  const [lookedUp, setLookedUp] = useState<ShopOrderResp | null>(null);

  useEffect(() => {
    if (!user) {
      setMine([]);
      return;
    }
    let cancelled = false;
    api
      .shopMine()
      .then((data) => {
        if (!cancelled) setMine(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setMine([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onQuery() {
    if (!lookupNo.trim()) return;
    if (!lookupEmail.trim() && !lookupClaim.trim()) {
      setError(t("shop.queryNeed"));
      return;
    }
    setBusy(true);
    setError(null);
    setLookedUp(null);
    try {
      const order = await api.shopQuery(lookupNo.trim(), {
        email: lookupEmail.trim() || undefined,
        claim: lookupClaim.trim() || undefined,
      });
      setLookedUp(order);
      rememberOrder(order);
      setLocalPurchases(getPurchases());
    } catch (err) {
      setError(te(err, "shop.queryFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("shop.queryTitle")}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{t("shop.queryLead")}</p>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Surface className="rounded-3xl p-6 md:p-9">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField fullWidth name="orderNo" value={lookupNo} onChange={setLookupNo}>
            <Label>{t("shop.queryOrderNo")}</Label>
            <Input variant="secondary" />
          </TextField>
          <TextField fullWidth name="lookupEmail" value={lookupEmail} onChange={setLookupEmail}>
            <Label>{t("shop.queryEmail")}</Label>
            <Input inputMode="email" type="email" variant="secondary" />
          </TextField>
          <TextField fullWidth name="claim" value={lookupClaim} onChange={setLookupClaim}>
            <Label>{t("shop.queryClaim")}</Label>
            <Input variant="secondary" />
          </TextField>
        </div>
        <Button className="mt-5" isPending={busy} size="lg" onPress={() => void onQuery()}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <MagnifyingGlass size={18} weight="bold" />}
              {isPending ? t("shop.querying") : t("shop.query")}
            </>
          )}
        </Button>
        {lookedUp && (
          <div className="mt-5 rounded-2xl border border-border/80 px-4 py-3">
            <p className="font-mono text-sm">{lookedUp.order_no}</p>
            <p className="mt-1 text-sm text-muted">
              {lookedUp.status === "paid" ? t("shop.status.paid") : t("shop.status.pending")} · {usd(lookedUp.amount_cents)}
            </p>
            {lookedUp.items?.length ? (
              <p className="mt-2 text-sm text-muted">
                {lookedUp.items.map((item) => `${item.product_slug} ×${item.quantity}`).join(" · ")}
              </p>
            ) : null}
            {lookedUp.status === "paid" && lookedUp.codes?.length ? (
              <p className="mt-3 break-all font-mono text-sm">{lookedUp.codes.join("  ")}</p>
            ) : null}
          </div>
        )}
      </Surface>

      <Surface className="rounded-3xl p-6 md:p-9">
        <div className="flex items-center gap-3">
          <Storefront size={28} weight="bold" />
          <h2 className="text-xl font-semibold">{t("shop.purchases")}</h2>
        </div>
        <p className="mt-3 text-sm text-muted">{user ? t("shop.purchasesLeadUser") : t("shop.purchasesLeadGuest")}</p>
        {user ? (
          !mine.length ? (
            <p className="mt-4 text-sm text-muted">{t("shop.purchasesEmpty")}</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {mine.map((order) => (
                <PurchaseRow
                  key={order.order_no}
                  amount={usd(order.amount_cents)}
                  codes={order.codes ?? []}
                  paid={order.status === "paid"}
                  slug={order.items?.map((item) => item.product_slug).join(" + ") || order.product_slug}
                  time={order.paid_at || order.created_at}
                  title={order.order_no}
                />
              ))}
            </ul>
          )
        ) : !localPurchases.length ? (
          <p className="mt-4 text-sm text-muted">{t("shop.purchasesEmpty")}</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {localPurchases.map((item) => (
              <PurchaseRow
                key={item.orderNo}
                amount={usd(item.amountCents)}
                codes={item.codes}
                paid={item.status === "paid"}
                slug={item.productSlug}
                time={item.paidAt}
                title={item.orderNo}
              />
            ))}
          </ul>
        )}
      </Surface>
    </section>
  );
}

function PurchaseRow({
  title,
  slug,
  amount,
  time,
  paid,
  codes,
}: {
  title: string;
  slug: string;
  amount: string;
  time: string;
  paid: boolean;
  codes: string[];
}) {
  const { t } = useI18n();
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-mono text-sm">{title}</p>
        <p className="mt-1 text-xs text-muted">
          {slug} · {time}
        </p>
        {paid && codes.length > 0 && <p className="mt-2 break-all font-mono text-sm">{codes.join("  ")}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="font-medium">{amount}</p>
          <p className="mt-1 text-xs text-muted">{paid ? t("shop.status.paid") : t("shop.status.pending")}</p>
        </div>
        {paid && codes[0] && (
          <Link className="button button--ghost text-sm" to="/">
            {t("shop.goRedeem")}
          </Link>
        )}
      </div>
    </li>
  );
}
