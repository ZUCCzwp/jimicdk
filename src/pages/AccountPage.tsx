import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Wallet, UserCircle } from "@phosphor-icons/react";
import { api } from "@/api/client";
import type { UserWalletResp } from "@/api/types";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import {
  Alert,
  Button,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
} from "@heroui/react";

const PRESETS = [30, 50, 100, 200, 500];

function yuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function AccountPage() {
  const location = useLocation();
  const { t, te } = useI18n();
  const { user, refresh, applyAuth, session } = useUser();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [wallet, setWallet] = useState<UserWalletResp | null>(null);
  const [amount, setAmount] = useState("50");
  const [busy, setBusy] = useState<"save" | "pay" | "load" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
  }, [user?.display_name]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBusy("load");
    Promise.all([refresh(), api.userWallet()])
      .then(([, w]) => {
        if (!cancelled) setWallet(w);
      })
      .catch((err) => {
        if (!cancelled) setError(te(err, "account.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setBusy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, refresh, te]);

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }
  const me = user;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const next = await api.userUpdateMe(displayName.trim());
      if (session) applyAuth(session.token, session.expiresAt, next);
      setNotice(t("account.saved"));
    } catch (err) {
      setError(te(err, "account.saveFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function onRecharge() {
    const usdAmount = Number(amount);
    if (!Number.isFinite(usdAmount) || usdAmount < 10) return;
    setBusy("pay");
    setError(null);
    setNotice(null);
    try {
      const res = await api.userRecharge(Math.round(usdAmount * 100));
      const w = await api.userWallet();
      setWallet(w);
      if (session) {
        applyAuth(session.token, session.expiresAt, { ...me, wallet_cents: res.balance_cents });
      }
      setNotice(res.credited ? t("wallet.success") : t("wallet.pending"));
    } catch (err) {
      setError(te(err, "wallet.failed"));
    } finally {
      setBusy(null);
    }
  }

  const balance = wallet?.balance_cents ?? me.wallet_cents;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="lg:col-span-2">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("account.title")}</h1>
        <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted md:text-lg">{t("account.lead")}</p>
      </div>

      {error && (
        <Alert className="lg:col-span-2" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {notice && (
        <Alert className="lg:col-span-2" status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Surface className="rounded-3xl p-6 md:p-9">
        <div className="flex items-center gap-3">
          <UserCircle size={28} weight="bold" />
          <h2 className="text-xl font-semibold">{t("account.profile")}</h2>
        </div>
        <form className="mt-6 space-y-5" onSubmit={onSave}>
          <div>
            <p className="text-sm text-muted">{t("account.username")}</p>
            <p className="mt-1 font-mono text-lg">{me.email || me.username}</p>
          </div>
          <TextField fullWidth name="displayName" value={displayName} onChange={setDisplayName}>
            <Label>{t("auth.displayName")}</Label>
            <Input variant="secondary" />
          </TextField>
          <p className="text-sm text-muted">{t("account.joined", { time: me.created_at })}</p>
          <Button isPending={busy === "save"} size="lg" type="submit">
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : null}
                {isPending ? t("account.saving") : t("account.save")}
              </>
            )}
          </Button>
        </form>
      </Surface>

      <Surface className="rounded-3xl p-6 md:p-9">
        <div className="flex items-center gap-3">
          <Wallet size={28} weight="bold" />
          <h2 className="text-xl font-semibold">{t("wallet.title")}</h2>
        </div>
        <p className="mt-6 text-sm text-muted">{t("wallet.balance")}</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">${yuan(balance)}</p>
        <p className="mt-3 text-sm text-muted">{t("wallet.lead")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <Button
              key={n}
              size="lg"
              type="button"
              variant={amount === String(n) ? "secondary" : "ghost"}
              onPress={() => setAmount(String(n))}
            >
              ${n}
            </Button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField fullWidth name="amount" value={amount} onChange={setAmount}>
              <Label>{t("wallet.custom")}</Label>
              <Input inputMode="decimal" variant="secondary" />
            </TextField>
          </div>
          <Button
            isDisabled={!Number.isFinite(Number(amount)) || Number(amount) < 10}
            isPending={busy === "pay"}
            size="lg"
            onPress={() => void onRecharge()}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <Wallet size={18} weight="bold" />}
                {isPending ? t("wallet.recharging") : t("wallet.recharge")}
              </>
            )}
          </Button>
        </div>

        <h3 className="mt-8 text-base font-semibold">{t("wallet.history")}</h3>
        {busy === "load" && !wallet ? (
          <div className="mt-4">
            <Spinner size="sm" />
          </div>
        ) : !wallet?.recharges.length ? (
          <p className="mt-3 text-sm text-muted">{t("wallet.empty")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {wallet.recharges.map((item) => (
              <li
                key={item.order_no}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{item.order_no}</p>
                  <p className="mt-1 text-xs text-muted">{item.paid_at || item.created_at}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">${yuan(item.amount_cents)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.status === "paid" ? t("wallet.status.paid") : t("wallet.status.pending")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </section>
  );
}
