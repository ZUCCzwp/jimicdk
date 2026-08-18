import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsClockwise, CopySimple, Stack, TrayArrowDown, Shuffle } from "@phosphor-icons/react";
import { api } from "@/api/client";
import {
  ApiError,
  PLAN_LABEL,
  type AdminCdkItem,
  type AdminCdkStatus,
  type AdminListScope,
  type AdminPlanStat,
  type PlanType,
} from "@/api/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { splitCodes } from "@/lib/codes";
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  Input,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

const PLANS: PlanType[] = ["plus", "5x", "20x"];
const SCOPES: AdminListScope[] = ["stock", "allocated", "used", "all"];
const EMPTY_STAT: AdminPlanStat = {
  plan_type: "plus",
  stock: 0,
  allocated: 0,
  used: 0,
  disabled: 0,
  replaced: 0,
  total: 0,
};
const MAX_IMPORT = 200;

export function AdminPoolPage() {
  const navigate = useNavigate();
  const { t, te } = useI18n();
  const [stats, setStats] = useState<AdminPlanStat[]>([]);
  const [items, setItems] = useState<AdminCdkItem[]>([]);
  const [scope, setScope] = useState<AdminListScope>("stock");
  const [planFilter, setPlanFilter] = useState<PlanType | "">("");
  const [query, setQuery] = useState("");
  const [importPlan, setImportPlan] = useState<PlanType>("plus");
  const [importRaw, setImportRaw] = useState("");
  const [allocatePlan, setAllocatePlan] = useState<PlanType>("plus");
  const [allocateCount, setAllocateCount] = useState("1");
  const [allocatedCodes, setAllocatedCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState<"load" | "import" | "allocate" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => splitCodes(importRaw, MAX_IMPORT), [importRaw]);
  const allocateStock = stats.find((s) => s.plan_type === allocatePlan)?.stock ?? 0;

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
    async (nextScope = scope, nextPlan = planFilter, nextQuery = query) => {
      setBusy("load");
      setError(null);
      try {
        const [pool, list] = await Promise.all([
          api.adminPool(),
          api.adminList({
            scope: nextScope,
            planType: nextPlan,
            q: nextQuery.trim(),
          }),
        ]);
        setStats(pool.plans);
        setItems(list.items);
      } catch (err) {
        if (guard(err)) return;
        setError(te(err, "api.failed"));
      } finally {
        setBusy(null);
      }
    },
    [guard, planFilter, query, scope, te],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, query ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [query, reload]);

  async function onImport() {
    if (preview.codes.length === 0) {
      setError(t("admin.importEmpty"));
      return;
    }
    setBusy("import");
    setError(null);
    setNotice(null);
    try {
      const res = await api.adminImport(importPlan, importRaw);
      setImportRaw("");
      setNotice(t("admin.importOk", { imported: res.imported, skipped: res.skipped }));
      await reload();
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
      setBusy(null);
    }
  }

  async function onAllocate() {
    const count = Number.parseInt(allocateCount, 10);
    if (!Number.isFinite(count) || count < 1) return;
    setBusy("allocate");
    setError(null);
    setNotice(null);
    setCopied(false);
    try {
      const res = await api.adminAllocate(allocatePlan, count);
      setAllocatedCodes(res.codes);
      setNotice(t("admin.allocateOk", { n: res.codes.length, plan: PLAN_LABEL[res.plan_type] }));
      await reload("allocated", allocatePlan, "");
      setScope("allocated");
      setPlanFilter(allocatePlan);
      setQuery("");
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
      setBusy(null);
    }
  }

  async function onCopy() {
    if (allocatedCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(allocatedCodes.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function statFor(plan: PlanType): AdminPlanStat {
    return stats.find((s) => s.plan_type === plan) ?? { ...EMPTY_STAT, plan_type: plan };
  }

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("admin.title")}</h1>
      <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted md:text-lg">{t("admin.lead")}</p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const s = statFor(plan);
          return (
            <Card key={plan} variant="secondary">
              <Card.Header>
                <Card.Description>{PLAN_LABEL[plan]}</Card.Description>
                <Card.Title className="text-3xl tabular-nums">{s.stock}</Card.Title>
              </Card.Header>
              <Card.Content className="grid grid-cols-2 gap-2 text-sm text-muted">
                <span>{t("admin.stock")}</span>
                <span className="text-right tabular-nums text-foreground">{s.stock}</span>
                <span>{t("admin.allocated")}</span>
                <span className="text-right tabular-nums text-foreground">{s.allocated}</span>
                <span>{t("admin.used")}</span>
                <span className="text-right tabular-nums text-foreground">{s.used}</span>
                <span>{t("admin.total")}</span>
                <span className="text-right tabular-nums text-foreground">{s.total}</span>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {error && (
        <Alert className="mt-8" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("api.failed")}</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {notice && (
        <Alert className="mt-8" status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <Surface className="flex flex-col gap-6 rounded-3xl p-6 md:p-9">
          <div className="flex items-center gap-2">
            <TrayArrowDown size={22} weight="bold" />
            <h2 className="text-xl font-semibold">{t("admin.importTitle")}</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">{t("admin.importLead")}</p>
          <PlanPicker value={importPlan} onChange={setImportPlan} />
          <TextField fullWidth name="import" value={importRaw} onChange={setImportRaw}>
            <Label>{t("admin.importLabel")}</Label>
            <TextArea
              className="min-h-40 font-mono text-sm"
              placeholder={t("admin.importPlaceholder")}
              rows={6}
              spellCheck={false}
              variant="secondary"
            />
            <Description>
              {preview.truncated
                ? t("admin.importTruncated", { n: MAX_IMPORT })
                : t("admin.importHint", { n: preview.codes.length })}
            </Description>
          </TextField>
          <Button
            isDisabled={preview.codes.length === 0 || busy !== null}
            isPending={busy === "import"}
            size="lg"
            onPress={() => void onImport()}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <TrayArrowDown size={20} weight="bold" />}
                {isPending ? t("admin.importing") : t("admin.import")}
              </>
            )}
          </Button>
        </Surface>

        <Surface className="flex flex-col gap-6 rounded-3xl p-6 md:p-9">
          <div className="flex items-center gap-2">
            <Shuffle size={22} weight="bold" />
            <h2 className="text-xl font-semibold">{t("admin.allocateTitle")}</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">{t("admin.allocateLead")}</p>
          <PlanPicker value={allocatePlan} onChange={setAllocatePlan} />
          <TextField
            fullWidth
            name="count"
            value={allocateCount}
            onChange={setAllocateCount}
          >
            <Label>{t("admin.allocateCount")}</Label>
            <Input inputMode="numeric" min={1} max={50} type="number" variant="secondary" />
            <Description>{t("admin.allocateStock", { n: allocateStock })}</Description>
          </TextField>
          <Button
            isDisabled={busy !== null || Number.parseInt(allocateCount, 10) < 1}
            isPending={busy === "allocate"}
            size="lg"
            onPress={() => void onAllocate()}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <Shuffle size={20} weight="bold" />}
                {isPending ? t("admin.allocating") : t("admin.allocate")}
              </>
            )}
          </Button>
          {allocatedCodes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{t("admin.allocatedCodes")}</p>
                <Button size="lg" variant="ghost" onPress={() => void onCopy()}>
                  <CopySimple size={16} weight="bold" />
                  {copied ? t("admin.copied") : t("admin.copy")}
                </Button>
              </div>
              <pre className="max-h-52 overflow-auto rounded-2xl bg-background p-4 font-mono text-sm leading-relaxed">
                {allocatedCodes.join("\n")}
              </pre>
            </div>
          )}
        </Surface>
      </div>

      <Surface className="mt-8 rounded-3xl p-6 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Stack size={22} weight="bold" />
            <h2 className="text-xl font-semibold">{t("admin.listTitle")}</h2>
          </div>
          <Button isDisabled={busy !== null} size="lg" variant="ghost" onPress={() => void reload()}>
            {busy === "load" ? <Spinner color="current" size="sm" /> : <ArrowsClockwise size={16} weight="bold" />}
            {t("admin.refresh")}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {SCOPES.map((item) => (
            <Button
              key={item}
              size="lg"
              variant={scope === item ? "secondary" : "ghost"}
              onPress={() => setScope(item)}
            >
              {t(`admin.scope.${item}` as MsgKey)}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="lg" variant={planFilter === "" ? "secondary" : "ghost"} onPress={() => setPlanFilter("")}>
            {t("admin.planAll")}
          </Button>
          {PLANS.map((plan) => (
            <Button
              key={plan}
              size="lg"
              variant={planFilter === plan ? "secondary" : "ghost"}
              onPress={() => setPlanFilter(plan)}
            >
              {PLAN_LABEL[plan]}
            </Button>
          ))}
        </div>
        <TextField className="mt-4 max-w-md" fullWidth name="q" value={query} onChange={setQuery}>
          <Label>{t("admin.search")}</Label>
          <Input placeholder={t("admin.searchPlaceholder")} variant="secondary" />
        </TextField>

        {items.length === 0 ? (
          <p className="mt-8 text-sm text-muted">{t("admin.empty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-medium">{t("admin.code")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.plan")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.pool")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.status")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.taskStatus")}</th>
                  <th className="py-3 pr-4 font-medium">{t("admin.account")}</th>
                  <th className="py-3 font-medium">{t("admin.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.code} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-mono text-[13px]">{item.code}</td>
                    <td className="py-3 pr-4">{PLAN_LABEL[item.plan_type] ?? item.plan_type}</td>
                    <td className="py-3 pr-4">
                      <PoolBadge allocated={item.allocated} status={item.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <Chip color={statusColor(item.status)} size="sm" variant="soft">
                        {t(`admin.cdk.${item.status}` as MsgKey)}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4">
                      {item.task_status ? (
                        <StatusBadge status={item.task_status} />
                      ) : (
                        <span className="text-muted">{t("admin.taskNone")}</span>
                      )}
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

function PlanPicker({ value, onChange }: { value: PlanType; onChange: (plan: PlanType) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLANS.map((plan) => (
        <Button
          key={plan}
          size="lg"
          variant={value === plan ? "secondary" : "ghost"}
          onPress={() => onChange(plan)}
        >
          {PLAN_LABEL[plan]}
        </Button>
      ))}
    </div>
  );
}

function PoolBadge({ allocated, status }: { allocated: boolean; status: AdminCdkStatus }) {
  const { t } = useI18n();
  if (status !== "available") {
    return (
      <Chip size="sm" variant="soft">
        —
      </Chip>
    );
  }
  return (
    <Chip color={allocated ? "accent" : "success"} size="sm" variant="soft">
      {allocated ? t("admin.poolAllocated") : t("admin.poolStock")}
    </Chip>
  );
}

function statusColor(status: AdminCdkStatus): "success" | "danger" | "warning" | "accent" {
  if (status === "available") return "success";
  if (status === "used") return "accent";
  if (status === "disabled") return "warning";
  return "danger";
}
