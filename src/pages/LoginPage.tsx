import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, EnvelopeSimple, Eye, EyeSlash, Lock, ShieldCheck, User } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { AuthBrandHeader } from "@/components/AuthBrandHeader";
import { AuthSideHero } from "@/components/AuthSideHero";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import { Alert, Button, Spinner } from "@heroui/react";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "w-full rounded-2xl border border-black/10 bg-white py-3.5 pl-12 pr-4 text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/15 dark:border-white/10 dark:bg-white/5";

function AuthField({
  label,
  icon,
  extra,
  children,
  hint,
}: {
  label: string;
  icon: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="ml-1 flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        {extra}
      </div>
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted transition-colors group-focus-within:text-[color:var(--accent)]">
          {icon}
        </div>
        {children}
      </div>
      {hint}
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, te } = useI18n();
  const { user, applyAuth } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate replace to={from && from.startsWith("/") && !from.startsWith("/admin") ? from : "/account"} />;
  }

  async function onSendCode() {
    const addr = email.trim();
    if (!emailRe.test(addr) || cooldown > 0) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.userSendCode(addr);
      setCooldown(60);
      if (res.dev_code) {
        setCode(res.dev_code);
        setNotice(t("auth.devCode", { code: res.dev_code }));
      } else {
        setNotice(t("auth.codeSent"));
      }
    } catch (err) {
      setError(te(err, "auth.sendCodeFailed"));
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !password) return;
    if (mode === "register") {
      if (!emailRe.test(addr)) {
        setError(t("api.invalidEmail"));
        return;
      }
      if (password.length < 8) {
        setError(t("api.invalidPassword"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.pwdMismatch"));
        return;
      }
      if (code.trim().length !== 6) {
        setError(t("api.invalidCode"));
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "register"
          ? await api.userRegister(addr, password, code.trim(), displayName.trim())
          : await api.userLogin(addr, password);
      applyAuth(res.token, res.expires_at, res.user);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/") && !from.startsWith("/admin") ? from : "/account", { replace: true });
    } catch (err) {
      setError(te(err, mode === "register" ? "auth.registerFailed" : "auth.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    mode === "register"
      ? Boolean(email.trim() && password.length >= 8 && password === confirmPassword && code.trim().length === 6)
      : Boolean(email.trim() && password);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirmPassword("");
    setCode("");
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] overflow-hidden bg-background">
      {(notice || error) && (
        <div className="fixed top-24 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2">
          <Alert status={error ? "danger" : "success"}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error ?? notice}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <AuthSideHero
        title={t("auth.heroTitle")}
        subtitle={t("auth.heroLead")}
        features={[t("auth.feat1"), t("auth.feat2"), t("auth.feat3"), t("auth.feat4")]}
      />

      <div className="flex w-full items-center justify-center bg-black/[0.02] p-6 dark:bg-transparent md:p-10 lg:w-1/2">
        <div className="w-full max-w-md py-6">
          <AuthBrandHeader tagline={t("auth.brandTag")} />
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
            </h1>
            <p className="text-sm text-muted">
              {mode === "login" ? t("auth.loginLead") : t("auth.registerLead")}
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" && (
              <AuthField label={t("auth.displayName")} icon={<User size={20} />}>
                <input
                  autoComplete="nickname"
                  className={fieldClass}
                  name="displayName"
                  placeholder={t("auth.placeholderName")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </AuthField>
            )}

            <AuthField label={t("auth.email")} icon={<EnvelopeSimple size={20} />}>
              <input
                autoComplete={mode === "register" ? "email" : "username"}
                autoFocus
                className={fieldClass}
                name="email"
                placeholder={t("auth.placeholderEmail")}
                type={mode === "register" ? "email" : "text"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </AuthField>

            {mode === "register" && (
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold">{t("auth.code")}</label>
                <div className="flex gap-2">
                  <div className="group relative min-w-0 flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted transition-colors group-focus-within:text-[color:var(--accent)]">
                      <ShieldCheck size={20} />
                    </div>
                    <input
                      autoComplete="one-time-code"
                      className={fieldClass}
                      inputMode="numeric"
                      maxLength={6}
                      name="code"
                      placeholder={t("auth.placeholderCode")}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <button
                    className="min-w-[7.5rem] rounded-2xl border border-[color:var(--accent)]/25 bg-white px-3 text-xs font-bold text-[color:var(--accent)] transition active:scale-95 disabled:cursor-not-allowed disabled:border-black/10 disabled:text-muted dark:bg-white/5"
                    disabled={!emailRe.test(email.trim()) || cooldown > 0 || sending}
                    type="button"
                    onClick={onSendCode}
                  >
                    {sending ? (
                      <Spinner color="current" size="sm" />
                    ) : cooldown > 0 ? (
                      t("auth.resendIn", { sec: cooldown })
                    ) : (
                      t("auth.sendCode")
                    )}
                  </button>
                </div>
              </div>
            )}

            <AuthField
              label={t("auth.password")}
              icon={<Lock size={20} />}
            >
              <input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className={`${fieldClass} pr-12`}
                name="password"
                placeholder={t("auth.placeholderPwd")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted hover:text-foreground"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </AuthField>

            {mode === "register" && (
              <AuthField label={t("auth.confirmPassword")} icon={<Lock size={20} />}>
                <input
                  autoComplete="new-password"
                  className={`${fieldClass} ${confirmPassword && password !== confirmPassword ? "border-red-400" : ""}`}
                  name="confirmPassword"
                  placeholder={t("auth.placeholderPwd")}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </AuthField>
            )}
            {mode === "register" && confirmPassword && password !== confirmPassword && (
              <p className="ml-1 text-xs text-red-500">{t("auth.pwdMismatch")}</p>
            )}

            <Button
              className="mt-2 w-full"
              isDisabled={!canSubmit}
              isPending={busy}
              size="lg"
              type="submit"
            >
              {({ isPending }) => (
                <>
                  {isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <>
                      {mode === "register" ? t("auth.register") : t("auth.login")}
                      <ArrowRight size={20} weight="bold" />
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              className="font-bold text-[color:var(--accent)]"
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? t("auth.registerNow") : t("auth.loginNow")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
