import { useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { ApiError, type TaskChallenge } from "@/api/types";
import { useI18n } from "@/i18n";
import { completeStripeChallenge } from "@/lib/stripeChallenge";
import { Alert, Button, Spinner } from "@heroui/react";

export function ChallengePrompt({
  cdkCode,
  taskId,
  challenge,
}: {
  cdkCode: string;
  taskId: string;
  challenge: TaskChallenge;
}) {
  const { t, te } = useI18n();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [doneSecret, setDoneSecret] = useState<string | null>(null);
  const waiting = doneSecret !== challenge.client_secret;

  async function onVerify() {
    setBusy(true);
    setNote(null);
    try {
      const outcome = await completeStripeChallenge(challenge);
      if (outcome !== "done") {
        setNote(t("challenge.incomplete"));
        return;
      }
      await api.challengeResolved(cdkCode, taskId);
      setDoneSecret(challenge.client_secret);
      setNote(t("challenge.resolved"));
    } catch (err) {
      setNote(err instanceof ApiError ? te(err, "challenge.failed") : t("challenge.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Alert className="mt-4" status={waiting ? "warning" : "success"}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{waiting ? t("challenge.title") : t("challenge.resolved")}</Alert.Title>
        <Alert.Description>
          <span className="mt-1 block">{waiting ? t("challenge.lead") : t("challenge.resolvedLead")}</span>
          {note && waiting ? <span className="mt-2 block">{note}</span> : null}
        </Alert.Description>
        {waiting ? (
          <Button className="mt-3" isPending={busy} size="lg" onPress={() => void onVerify()}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <ShieldCheck size={16} weight="bold" />}
                {isPending ? t("challenge.working") : t("challenge.action")}
              </>
            )}
          </Button>
        ) : null}
      </Alert.Content>
    </Alert>
  );
}
