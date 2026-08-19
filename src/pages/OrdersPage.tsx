import { ArrowsClockwise, CopySimple, Prohibit, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { PLAN_LABEL, isCancellable, isRefreshable, isTerminal } from "@/api/types";
import type { RefreshCdkResp, TaskView } from "@/api/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useOrders, useTaskPoll } from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import { splitCodes } from "@/lib/codes";
import {
  Alert,
  Button,
  Description,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders, trackMany, drop, replace } = useOrders();
  const { user } = useUser();
  const { t, tb, te } = useI18n();
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [refreshed, setRefreshed] = useState<RefreshCdkResp | null>(null);
  const [copied, setCopied] = useState(false);
  const [accountTasks, setAccountTasks] = useState<TaskView[]>([]);

  useEffect(() => {
    if (!user) {
      setAccountTasks([]);
      return;
    }
    let cancelled = false;
    api
      .userOrders()
      .then((res) => {
        if (!cancelled) setAccountTasks(res.tasks ?? []);
      })
      .catch(() => {
        if (!cancelled) setAccountTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const accountCodes = useMemo(() => accountTasks.map((item) => item.cdk_code).filter(Boolean), [accountTasks]);
  const codes = useMemo(() => {
    const seen = new Set<string>();
    const next: string[] = [];
    for (const code of [...accountCodes, ...orders.map((o) => o.cdkCode)]) {
      if (!code || seen.has(code)) continue;
      seen.add(code);
      next.push(code);
    }
    return next;
  }, [accountCodes, orders]);
  const { tasks, error, loading } = useTaskPoll(codes);
  const byCode = new Map(tasks.map((item) => [item.cdk_code, item]));
  for (const item of accountTasks) {
    if (!byCode.has(item.cdk_code)) byCode.set(item.cdk_code, item);
  }

  function onLookup() {
    const parsed = splitCodes(draft);
    if (parsed.codes.length === 0) {
      setTruncated(false);
      setFormError(t("orders.batchEmpty"));
      return;
    }
    trackMany(parsed.codes);
    setFormError(null);
    setTruncated(parsed.truncated);
  }

  async function onRefresh(cdkCode: string) {
    setRefreshing(cdkCode);
    setFormError(null);
    try {
      const res = await api.refreshCdk(cdkCode);
      replace(cdkCode, res.new_code);
      setAccountTasks((prev) =>
        prev.map((item) => (item.cdk_code === cdkCode ? { ...item, cdk_code: res.new_code } : item)),
      );
      setRefreshed(res);
      setCopied(false);
    } catch (err) {
      setFormError(te(err, "refresh.failed"));
    } finally {
      setRefreshing(null);
    }
  }

  async function copyNewCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const found = tasks.length;

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("orders.title")}</h1>
      <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted md:text-lg">
        {user ? t("orders.signedInLead") : t("orders.lead")}
      </p>

      <Surface className="mt-10 flex flex-col gap-6 rounded-3xl p-6 md:p-9">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onLookup();
          }}
        >
          <TextField fullWidth name="codes" value={draft} onChange={setDraft}>
            <Label>{t("orders.batchLabel")}</Label>
            <TextArea
              className="min-h-36 font-mono text-sm"
              placeholder={t("orders.batchPlaceholder")}
              rows={5}
              spellCheck={false}
              variant="secondary"
            />
            <Description>{t("orders.batchHint")}</Description>
          </TextField>
          {formError && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{formError}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          <Button
            isDisabled={!draft.trim()}
            size="lg"
            type="button"
            onPress={onLookup}
          >
            {t("orders.batchQuery")}
          </Button>
        </form>
      </Surface>

      {codes.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          {t("orders.batchFound", { found, total: codes.length })}
          {truncated ? ` ${t("orders.batchTruncated")}` : ""}
        </p>
      )}

      {refreshed && (
        <Alert className="mt-6" status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("refresh.success")}</Alert.Title>
            <Alert.Description>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span className="break-all font-mono text-sm">{refreshed.new_code}</span>
                <Button
                  size="lg"
                  type="button"
                  variant="secondary"
                  onPress={() => void copyNewCode(refreshed.new_code)}
                >
                  <CopySimple size={14} />
                  {copied ? t("refresh.copied") : t("refresh.copy")}
                </Button>
                {refreshed.refresh_remaining > 0
                  ? t("refresh.remaining", { n: refreshed.refresh_remaining })
                  : null}
              </span>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {error && (
        <Alert className="mt-6" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("orders.queryFailed")}</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {codes.length === 0 ? (
        <div className="mt-10 max-w-lg rounded-3xl border border-border/80 bg-surface p-6">
          <p className="text-lg font-semibold">{t("orders.emptyTitle")}</p>
          <p className="mt-2 text-muted">{user ? t("orders.emptyDesc") : t("orders.emptyGuest")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onPress={() => navigate("/")}>{t("orders.goRedeem")}</Button>
            {!user && (
              <Button variant="secondary" onPress={() => navigate("/login")}>
                {t("nav.login")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {codes.map((cdkCode) => {
            const task = byCode.get(cdkCode);
            const localOnly = !accountCodes.includes(cdkCode);
            return (
              <li key={cdkCode}>
                <div className="rounded-3xl border border-border/80 bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-base font-medium">{cdkCode}</p>
                      <p className="mt-1 text-sm text-muted">
                        {task?.plan_type
                          ? `${PLAN_LABEL[task.plan_type] ?? task.plan_type}  ${task.account_email}`
                          : loading
                            ? t("orders.looking")
                            : t("orders.notFound")}
                      </p>
                      {task?.task_status === "completed" && (task.completed_at || task.updated_at) ? (
                        <p className="mt-1 text-sm text-muted">
                          {t("orders.redeemedAt", { time: task.completed_at || task.updated_at })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {task?.task_status ? (
                        <StatusBadge size="lg" status={task.task_status} />
                      ) : loading ? (
                        <Spinner size="sm" />
                      ) : null}
                      {task && isCancellable(task.task_status) && (
                        <Button
                          isIconOnly
                          aria-label={t("orders.cancelAria")}
                          size="lg"
                          variant="ghost"
                          onPress={() => navigate(`/cancel?cdk=${encodeURIComponent(cdkCode)}`)}
                        >
                          <Prohibit size={16} />
                        </Button>
                      )}
                      {isRefreshable(task?.task_status) && (
                        <Button
                          isIconOnly
                          aria-label={t("orders.refreshAria")}
                          isPending={refreshing === cdkCode}
                          size="lg"
                          variant="ghost"
                          onPress={() => void onRefresh(cdkCode)}
                        >
                          <ArrowsClockwise size={16} />
                        </Button>
                      )}
                      {localOnly && (!task || isTerminal(task.task_status)) && (
                        <Button
                          isIconOnly
                          aria-label={t("orders.removeAria")}
                          size="lg"
                          variant="ghost"
                          onPress={() => drop(cdkCode)}
                        >
                          <Trash size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {task?.failure_reason && (
                    <p className="mt-3 text-sm text-danger">{tb(task.failure_reason)}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
