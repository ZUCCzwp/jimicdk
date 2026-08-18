import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowsClockwise, CopySimple } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { ApiError, PLAN_LABEL } from "@/api/types";
import type { RefreshCdkResp, VerifyCdkResp } from "@/api/types";
import { CredentialNotice } from "@/components/CredentialNotice";
import { RedeemFaq } from "@/components/RedeemFaq";
import { RedeemStepper } from "@/components/RedeemStepper";
import { SessionGuide } from "@/components/SessionGuide";
import { useOrders } from "@/hooks/useApi";
import { useI18n } from "@/i18n";
import { sessionEmail, sessionIssue } from "@/lib/session";
import {
  Alert,
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

type Step = 1 | 2 | 3;

export function RedeemPage() {
  const navigate = useNavigate();
  const { track } = useOrders();
  const { t, tb, te } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [cdk, setCdk] = useState("");
  const [session, setSession] = useState("");
  const [verify, setVerify] = useState<VerifyCdkResp | null>(null);
  const [busy, setBusy] = useState<"verify" | "create" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [refreshed, setRefreshed] = useState<RefreshCdkResp | null>(null);
  const [copied, setCopied] = useState(false);

  const issue = useMemo(() => (session.trim() ? sessionIssue(session) : null), [session]);
  const sessionError = issue ? t(issue.key, issue.vars) : null;
  const email = useMemo(() => sessionEmail(session), [session]);

  async function onVerifyNext(code = cdk) {
    const value = code.trim();
    if (!value) return;
    setCdk(value);
    setBusy("verify");
    setError(null);
    try {
      const res = await api.verifyCdk(value);
      setVerify(res);
      if (res.valid) {
        setStep(2);
        return;
      }
      setError(tb(res.error, res.code) || t("verify.unavailable"));
    } catch (err) {
      setVerify(null);
      setError(te(err, "verify.failed"));
    } finally {
      setBusy(null);
    }
  }

  function onSessionNext() {
    const nextIssue = sessionIssue(session);
    if (nextIssue) {
      setError(t(nextIssue.key, nextIssue.vars));
      return;
    }
    setError(null);
    setStep(3);
  }

  async function onCreate() {
    const nextIssue = sessionIssue(session);
    if (nextIssue) {
      setError(t(nextIssue.key, nextIssue.vars));
      return;
    }
    setBusy("create");
    setError(null);
    try {
      const res = await api.createTask(cdk.trim(), session.trim());
      track(cdk.trim(), res.task_id);
      setSubmitted(true);
      setVerify({
        valid: false,
        pending: true,
        cancellable: true,
        error: t("verify.pending"),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.taskId) {
        track(cdk.trim(), err.taskId);
        setError(te(err, "create.failed"));
        return;
      }
      setError(te(err, "create.failed"));
    } finally {
      setBusy(null);
    }
  }

  async function onRefresh() {
    const value = cdk.trim();
    if (!value) return;
    setBusy("refresh");
    setError(null);
    try {
      const res = await api.refreshCdk(value);
      setCdk(res.new_code);
      setRefreshed(res);
      setCopied(false);
      setVerify({
        valid: true,
        plan_type: res.plan_type,
        refresh_remaining: res.refresh_remaining || undefined,
      });
    } catch (err) {
      setError(te(err, "refresh.failed"));
    } finally {
      setBusy(null);
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

  function resetCdk(next: string) {
    setCdk(next);
    setVerify(null);
    setSubmitted(false);
    setError(null);
    setRefreshed(null);
  }

  return (
    <section>
        <h1 className="max-w-[18ch] text-4xl font-semibold tracking-tight md:text-5xl">
          {t("redeem.title")}
        </h1>
        <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-muted md:text-lg">
          {t("redeem.lead")}
        </p>

        <div className="mt-10">
          <RedeemStepper step={step} />
        </div>

        {step === 2 ? (
          <div className="mt-6 space-y-6">
            <CredentialNotice />
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <SessionGuide />
            <Surface className="flex flex-col gap-6 rounded-3xl p-6 md:p-9">
              <form
                className="space-y-7"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSessionNext();
                }}
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{t("session.title")}</h2>
                  <p className="mt-2 text-base text-muted">{t("session.lead")}</p>
                </div>
                <TextField
                  fullWidth
                  isInvalid={Boolean(sessionError)}
                  name="session"
                  value={session}
                  onChange={(v) => {
                    setSession(v);
                    setError(null);
                  }}
                >
                  <Label>{t("session.label")}</Label>
                  <TextArea
                    className="min-h-52 font-mono text-sm"
                    placeholder='{"accessToken":"...","user":{"email":"you@example.com"},"account":{"planType":"free"}}'
                    rows={8}
                    spellCheck={false}
                    variant="secondary"
                  />
                  {sessionError ? (
                    <FieldError>{sessionError}</FieldError>
                  ) : email ? (
                    <Description>{t("session.account", { email })}</Description>
                  ) : (
                    <Description>{t("session.needFree")}</Description>
                  )}
                </TextField>
                {error && <FormError title={t("cannotContinue")} message={error} />}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="sm:flex-1"
                    type="button"
                    variant="ghost"
                    onPress={() => {
                      setError(null);
                      setStep(1);
                    }}
                  >
                    <ArrowLeft size={16} weight="bold" />
                    {t("back")}
                  </Button>
                  <Button
                    className="sm:flex-1"
                    isDisabled={!session.trim()}
                    size="lg"
                    type="button"
                    onPress={onSessionNext}
                  >
                    {t("verify.next")}
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </div>
              </form>
            </Surface>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
            <aside className="order-2 lg:sticky lg:top-28 lg:order-1">
              <RedeemFaq />
            </aside>
            <Surface className="order-1 flex flex-col gap-6 rounded-3xl p-6 md:p-9 lg:order-2">
            {step === 1 && (
              <form
                className="space-y-7"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (cdk.trim() && busy === null) void onVerifyNext();
                }}
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{t("verify.title")}</h2>
                  <p className="mt-2 text-base text-muted">{t("verify.lead")}</p>
                </div>
                <TextField
                  fullWidth
                  isInvalid={Boolean(verify && !verify.valid)}
                  name="cdk"
                  value={cdk}
                  onChange={resetCdk}
                >
                  <Label>{t("verify.label")}</Label>
                  <Input
                    autoComplete="off"
                    className="min-h-12 font-mono text-base"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    variant="secondary"
                  />
                  {verify?.valid ? (
                    <Description>
                      {t("verify.ok", { plan: PLAN_LABEL[verify.plan_type ?? "plus"] })}
                      {verify.refresh_remaining
                        ? ` · ${t("refresh.remaining", { n: verify.refresh_remaining })}`
                        : ""}
                    </Description>
                  ) : verify?.error && !error ? (
                    <FieldError>{tb(verify.error, verify.code)}</FieldError>
                  ) : (
                    <Description>{t("verify.hint")}</Description>
                  )}
                </TextField>
                {refreshed && (
                  <Alert status="success">
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
                {error && <FormError title={t("cannotContinue")} message={error} />}
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    className="sm:flex-1"
                    isDisabled={!cdk.trim() || Boolean(verify?.pending) || busy === "verify"}
                    isPending={busy === "refresh"}
                    size="lg"
                    type="button"
                    variant="secondary"
                    onPress={() => void onRefresh()}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending ? <Spinner color="current" size="sm" /> : null}
                        {isPending ? t("refresh.working") : t("refresh.button")}
                        {!isPending ? <ArrowsClockwise size={16} weight="bold" /> : null}
                      </>
                    )}
                  </Button>
                  <Button
                    className="sm:flex-1"
                    isDisabled={!cdk.trim() || busy === "refresh"}
                    isPending={busy === "verify"}
                    size="lg"
                    type="button"
                    onPress={() => void onVerifyNext()}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending ? <Spinner color="current" size="sm" /> : null}
                        {isPending ? t("verify.checking") : t("verify.next")}
                        {!isPending ? <ArrowRight size={16} weight="bold" /> : null}
                      </>
                    )}
                  </Button>
                </div>
                {verify?.cancellable && (
                  <Button
                    fullWidth
                    type="button"
                    variant="ghost"
                    onPress={() => navigate(`/cancel?cdk=${encodeURIComponent(cdk.trim())}`)}
                  >
                    {t("verify.cancelQueued")}
                  </Button>
                )}
              </form>
            )}

            {step === 3 && (
              <div className="space-y-7">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {submitted ? t("confirm.submitted") : t("confirm.title")}
                  </h2>
                  <p className="mt-2 text-base text-muted">
                    {submitted ? t("confirm.doneLead") : t("confirm.lead")}
                  </p>
                </div>
                <dl className="grid gap-5 text-base">
                  <div>
                    <dt className="text-muted">{t("confirm.cdk")}</dt>
                    <dd className="mt-1 break-all font-mono">{cdk}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t("confirm.plan")}</dt>
                    <dd className="mt-1">{PLAN_LABEL[verify?.plan_type ?? "plus"]}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t("confirm.account")}</dt>
                    <dd className="mt-1 truncate">{email ?? t("confirm.noEmail")}</dd>
                  </div>
                </dl>
                {error && <FormError title={t("cannotSubmit")} message={error} />}
                {submitted ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button className="sm:flex-1" size="lg" onPress={() => navigate("/orders")}>
                      {t("confirm.viewOrders")}
                    </Button>
                    {verify?.cancellable && (
                      <Button
                        className="sm:flex-1"
                        type="button"
                        variant="ghost"
                        onPress={() => navigate(`/cancel?cdk=${encodeURIComponent(cdk.trim())}`)}
                      >
                        {t("confirm.cancel")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="sm:flex-1"
                      type="button"
                      variant="ghost"
                      onPress={() => {
                        setError(null);
                        setStep(2);
                      }}
                    >
                      <ArrowLeft size={16} weight="bold" />
                      {t("back")}
                    </Button>
                    <Button
                      className="sm:flex-1"
                      isPending={busy === "create"}
                      size="lg"
                      onPress={() => void onCreate()}
                    >
                      {({ isPending }) => (
                        <>
                          {isPending ? <Spinner color="current" size="sm" /> : null}
                          {isPending ? t("confirm.submitting") : t("confirm.submit")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            </Surface>
          </div>
        )}
    </section>
  );
}

function FormError({ title, message }: { title: string; message: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
