import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { SignIn } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { BrandLogo } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";
import { getAdminSession, setAdminSession } from "@/lib/storage";
import { Alert, Button, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, te } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existing = getAdminSession();

  if (existing) {
    return <Navigate replace to="/admin" />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.adminLogin(username.trim(), password);
      setAdminSession({
        token: res.token,
        username: res.username,
        expiresAt: res.expires_at,
      });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith("/admin") ? from : "/admin", { replace: true });
    } catch (err) {
      setError(te(err, "admin.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-enter flex min-h-[100dvh] items-center justify-center px-5 py-12 text-foreground">
      <Surface className="w-full max-w-md rounded-3xl bg-surface/80 p-8 backdrop-blur-md md:p-10">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-10" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.loginTitle")}</h1>
            <p className="mt-1 text-sm text-muted">{t("admin.loginLead")}</p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <TextField fullWidth name="username" value={username} onChange={setUsername}>
            <Label>{t("admin.username")}</Label>
            <Input autoComplete="username" autoFocus variant="secondary" />
          </TextField>
          <TextField fullWidth name="password" value={password} onChange={setPassword}>
            <Label>{t("admin.password")}</Label>
            <Input autoComplete="current-password" type="password" variant="secondary" />
          </TextField>
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("admin.loginFailed")}</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          <Button
            className="w-full"
            isDisabled={!username.trim() || !password}
            isPending={busy}
            size="lg"
            type="submit"
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <SignIn size={20} weight="bold" />}
                {isPending ? t("admin.loggingIn") : t("admin.login")}
              </>
            )}
          </Button>
        </form>
      </Surface>
    </div>
  );
}
