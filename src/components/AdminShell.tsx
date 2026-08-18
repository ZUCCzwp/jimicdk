import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ListChecks, Moon, SignOut, Stack, Sun, Translate } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { BrandLogo } from "@/components/BrandLogo";
import { Alert, Button } from "@heroui/react";
import { useAnnouncement } from "@/hooks/useApi";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { clearAdminSession, getAdminSession, getTheme, setTheme, type Theme } from "@/lib/storage";

const nav: Array<{
  to: string;
  id: string;
  label: MsgKey;
  end?: boolean;
  icon: ComponentType<{ size: number; weight: "bold" }>;
}> = [
  { to: "/admin", id: "pool", label: "admin.nav.pool", icon: Stack, end: true },
  { to: "/admin/tasks", id: "tasks", label: "admin.nav.tasks", icon: ListChecks },
];

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const announcement = useAnnouncement();
  const { locale, setLocale, t } = useI18n();
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const session = getAdminSession();

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin/login" />;
  }

  function onLogout() {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-[100dvh] text-foreground">
      <header className="app-header">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <NavLink className="group flex shrink-0 items-center gap-2.5 text-foreground" to="/admin">
              <BrandLogo className="size-9 transition-transform group-hover:scale-110" />
              <span className="truncate text-lg font-semibold tracking-tight">{t("admin.brand")}</span>
            </NavLink>
            <nav className="hidden items-center gap-2 sm:flex">
              {nav.map((item) => {
                const active = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.id}
                    className={`button text-base ${active ? "button--secondary" : "button--ghost"}`}
                    end={item.end}
                    to={item.to}
                  >
                    <item.icon size={24} weight="bold" />
                    {t(item.label)}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[16ch] truncate text-sm text-muted md:inline">{session.username}</span>
            <Button
              aria-label={locale === "zh" ? t("lang.toEn") : t("lang.toZh")}
              size="lg"
              variant="ghost"
              onPress={() => setLocale(locale === "zh" ? "en" : "zh")}
            >
              <Translate size={20} weight="bold" />
              {locale === "zh" ? "EN" : "中"}
            </Button>
            <Button
              isIconOnly
              aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
              size="lg"
              variant="ghost"
              onPress={() => setThemeState(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={24} weight="bold" /> : <Moon size={24} weight="bold" />}
            </Button>
            <Button size="lg" variant="ghost" onPress={onLogout}>
              <SignOut size={20} weight="bold" />
              {t("admin.logout")}
            </Button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-3 sm:hidden">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.id}
                className={`button text-base ${active ? "button--secondary" : "button--ghost"}`}
                end={item.end}
                to={item.to}
              >
                <item.icon size={24} weight="bold" />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>
      </header>
      {announcement?.enabled && announcement.content && (
        <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("announce")}</Alert.Title>
              <Alert.Description>{announcement.content}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 md:py-16">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
