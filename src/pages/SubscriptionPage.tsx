import { useMemo, useState } from "react";
import { api } from "@/api/client";
import type { SubscriptionSummary } from "@/api/types";
import { CredentialNotice } from "@/components/CredentialNotice";
import { SessionGuide } from "@/components/SessionGuide";
import { useI18n } from "@/i18n";
import { sessionEmail } from "@/lib/session";
import {
  Alert,
  Button,
  Card,
  Description,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

export function SubscriptionPage() {
  const { t, te } = useI18n();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const email = useMemo(() => sessionEmail(token), [token]);

  async function onCheck() {
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const res = await api.checkSubscription(token.trim());
      setSummary(res.summary ?? null);
    } catch (err) {
      setError(te(err, "sub.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("sub.title")}</h1>
      <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted md:text-lg">
        {t("sub.lead")}
      </p>

      <div className="mt-10 space-y-6">
        <CredentialNotice />
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <SessionGuide showRecharge={false} />
        <Surface className="flex flex-col gap-6 rounded-3xl p-6 md:p-9">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void onCheck();
            }}
          >
            <TextField fullWidth name="token" value={token} onChange={setToken}>
              <Label>{t("sub.label")}</Label>
              <TextArea
                className="min-h-44 font-mono text-sm"
                placeholder={t("sub.placeholder")}
                rows={6}
                spellCheck={false}
                variant="secondary"
              />
              {email ? (
                <Description>{t("sub.account", { email })}</Description>
              ) : (
                <Description>{t("sub.hint")}</Description>
              )}
            </TextField>
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("sub.failed")}</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <Button
              isDisabled={!token.trim()}
              isPending={busy}
              size="lg"
              type="button"
              onPress={() => void onCheck()}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? t("sub.checking") : t("sub.check")}
                </>
              )}
            </Button>
          </form>
        </Surface>
        </div>
      </div>

      {summary && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Item label={t("sub.plan")} value={summary.plan_type} />
          <Item label={t("sub.planName")} value={summary.subscription_plan} />
          <Item label={t("sub.active")} value={summary.has_active_subscription ? t("yes") : t("no")} />
          <Item label={t("sub.expires")} value={summary.expires_at || "-"} />
          <Item label={t("sub.renews")} value={summary.renews_at || "-"} />
          <Item label={t("sub.willRenew")} value={summary.will_renew ? t("yes") : t("no")} />
          <Item label={t("sub.currency")} value={summary.billing_currency || "-"} />
          <Item label={t("sub.period")} value={summary.billing_period || "-"} />
        </div>
      )}
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Description>{label}</Card.Description>
        <Card.Title className="break-all text-lg">{value}</Card.Title>
      </Card.Header>
    </Card>
  );
}
