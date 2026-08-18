import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { ApiError } from "@/api/types";
import type { CancelTaskResp, TaskView, VerifyCdkResp } from "@/api/types";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskPanel } from "@/components/TaskPanel";
import { useOrders } from "@/hooks/useApi";
import { useI18n } from "@/i18n";
import {
  Alert,
  Button,
  Description,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
} from "@heroui/react";

export function CancelPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { drop } = useOrders();
  const { t, tb, te } = useI18n();
  const [cdk, setCdk] = useState(() => params.get("cdk") ?? "");
  const [busy, setBusy] = useState<"lookup" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyCdkResp | null>(null);
  const [task, setTask] = useState<TaskView | null>(null);
  const [result, setResult] = useState<CancelTaskResp | null>(null);

  async function onLookup() {
    setBusy("lookup");
    setError(null);
    setResult(null);
    setTask(null);
    try {
      const res = await api.verifyCdk(cdk.trim());
      setVerify(res);
      if (res.pending) {
        const current = await api.lookupTask(cdk.trim()).catch(() => null);
        setTask(current);
      }
      if (!res.pending && !res.valid && res.error) {
        setError(tb(res.error));
      }
    } catch (err) {
      setVerify(null);
      setError(te(err, "orders.queryFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function onCancel() {
    setBusy("cancel");
    setError(null);
    try {
      const res = await api.cancelTask(cdk.trim());
      setResult(res);
      setTask(null);
      setVerify({ valid: true, plan_type: res.plan_type as VerifyCdkResp["plan_type"] });
      drop(cdk.trim());
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "already_running") {
        setError(te(err, "cancel.failed"));
        const res = await api.verifyCdk(cdk.trim()).catch(() => null);
        if (res) setVerify(res);
        const current = await api.lookupTask(cdk.trim()).catch(() => null);
        setTask(current);
        return;
      }
      setError(te(err, "cancel.failed"));
    } finally {
      setBusy(null);
    }
  }

  const canCancel = Boolean(verify?.cancellable);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-12">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("cancel.title")}</h1>
        <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted md:text-lg">
          {t("cancel.lead")}
        </p>

        <Surface className="mt-10 flex flex-col gap-6 rounded-3xl p-6 md:p-9">
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{t("cancel.hint")}</Alert.Description>
            </Alert.Content>
          </Alert>

          <form
            className="space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              void onLookup();
            }}
          >
            <TextField
              fullWidth
              name="cdk"
              value={cdk}
              onChange={(v) => {
                setCdk(v);
                setVerify(null);
                setTask(null);
                setResult(null);
                setError(null);
              }}
            >
              <Label>{t("cancel.label")}</Label>
              <Input
                required
                autoComplete="off"
                className="min-h-12 font-mono text-base"
                placeholder={t("cancel.placeholder")}
                variant="secondary"
              />
              <Description>{t("cancel.desc")}</Description>
            </TextField>

            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("cannotContinue")}</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {result && (
              <Alert status="success">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("cancel.done")}</Alert.Title>
                  <Alert.Description>{tb(result.message)}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {verify?.pending && !canCancel && !result && (
              <Alert status="warning">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("cancel.cannot")}</Alert.Title>
                  <Alert.Description>{t("cancel.cannotDesc")}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {verify?.valid && !result && (
              <Alert status="success">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("cancel.none")}</Alert.Title>
                  <Alert.Description>{t("cancel.noneDesc")}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Button
                fullWidth
                isDisabled={!cdk.trim()}
                isPending={busy === "lookup"}
                size="lg"
                type="button"
                onPress={() => void onLookup()}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? t("cancel.looking") : t("cancel.lookup")}
                  </>
                )}
              </Button>
              {canCancel && (
                <Button
                  fullWidth
                  isPending={busy === "cancel"}
                  size="lg"
                  type="button"
                  variant="danger"
                  onPress={() => void onCancel()}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {isPending ? t("cancel.cancelling") : t("cancel.submit")}
                    </>
                  )}
                </Button>
              )}
              {result && (
                <Button fullWidth size="lg" type="button" variant="secondary" onPress={() => navigate("/")}>
                  {t("cancel.resubmit")}
                </Button>
              )}
            </div>
          </form>
        </Surface>
      </section>

      <aside className="lg:sticky lg:top-28">
        <TaskPanel empty={t("task.emptyCancel")} task={task} />
        {task && (
          <p className="mt-3 text-sm text-muted">
            {t("task.currentStatus")} <StatusBadge status={task.task_status} />
          </p>
        )}
      </aside>
    </div>
  );
}
