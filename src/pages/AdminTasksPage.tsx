import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsClockwise, ListChecks } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { ApiError, PLAN_LABEL, type PlanType, type TaskView } from "@/api/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
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

const PLANS: PlanType[] = ["plus", "5x", "20x"];
const TASK_SCOPES = ["", "in_progress", "completed", "failed"] as const;
type TaskScope = (typeof TASK_SCOPES)[number];

export function AdminTasksPage() {
  const navigate = useNavigate();
  const { t, te } = useI18n();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<PlanType | "">("");
  const [scope, setScope] = useState<TaskScope>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guard = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/admin/login", { replace: true });
        return true;
      }
      return false;
    },
    [navigate],
  );

  const reload = useCallback(
    async (nextQuery = query, nextPlan = plan, nextScope = scope) => {
      setBusy(true);
      setError(null);
      try {
        const res = await api.adminTasks({
          q: nextQuery.trim(),
          planType: nextPlan,
          status: nextScope,
        });
        setTasks(res.tasks);
      } catch (err) {
        if (guard(err)) return;
        setError(te(err, "api.failed"));
      } finally {
        setBusy(false);
      }
    },
    [guard, plan, query, scope, te],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, query ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [query, reload]);

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("admin.taskTitle")}</h1>
      <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted md:text-lg">{t("admin.taskLead")}</p>

      {error && (
        <Alert className="mt-8" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("api.failed")}</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Surface className="mt-10 rounded-3xl p-6 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={22} weight="bold" />
            <h2 className="text-xl font-semibold">{t("admin.taskSearch")}</h2>
          </div>
          <Button isDisabled={busy} size="lg" variant="ghost" onPress={() => void reload()}>
            {busy ? <Spinner color="current" size="sm" /> : <ArrowsClockwise size={16} weight="bold" />}
            {t("admin.refresh")}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TASK_SCOPES.map((item) => (
            <Button
              key={item || "all"}
              size="lg"
              variant={scope === item ? "secondary" : "ghost"}
              onPress={() => setScope(item)}
            >
              {item ? t(`admin.taskScope.${item}` as MsgKey) : t("admin.taskScope.all")}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="lg" variant={plan === "" ? "secondary" : "ghost"} onPress={() => setPlan("")}>
            {t("admin.planAll")}
          </Button>
          {PLANS.map((item) => (
            <Button
              key={item}
              size="lg"
              variant={plan === item ? "secondary" : "ghost"}
              onPress={() => setPlan(item)}
            >
              {PLAN_LABEL[item]}
            </Button>
          ))}
        </div>
        <TextField className="mt-4" fullWidth name="task-q" value={query} onChange={setQuery}>
          <Label>{t("admin.taskSearch")}</Label>
          <TextArea
            className="min-h-24 font-mono text-sm"
            placeholder={t("admin.taskSearchPlaceholder")}
            rows={3}
            spellCheck={false}
            variant="secondary"
          />
          <Description>{t("admin.taskSearchHint")}</Description>
        </TextField>

        {tasks.length === 0 ? (
          <p className="mt-8 text-sm text-muted">{t("admin.taskEmpty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-medium">{t("admin.code")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.taskId")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.plan")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.taskStatus")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.account")}</th>
                  <th className="py-3 font-medium">{t("admin.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((item) => (
                  <tr key={item.task_id} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-mono text-[13px]">{item.cdk_code}</td>
                    <td className="py-3 pr-4 font-mono text-[13px]">{item.task_id}</td>
                    <td className="py-3 pr-4">{PLAN_LABEL[item.plan_type] ?? item.plan_type}</td>
                    <td className="py-3 pr-4">
                      <div className="space-y-1">
                        <StatusBadge status={item.task_status} />
                        {item.failure_reason ? (
                          <p className="max-w-[28ch] text-xs text-muted">{item.failure_reason}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted">{item.account_email || "—"}</td>
                    <td className="py-3 text-muted">{item.updated_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </section>
  );
}
