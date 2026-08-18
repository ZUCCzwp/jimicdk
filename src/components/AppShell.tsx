import { NavLink, useLocation } from "react-router-dom";
import { Question, Key, ListChecks, Moon, Prohibit, Sun, Translate, UserCircleCheck } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { Button, Chip } from "@heroui/react";
import { useQueue } from "@/hooks/useApi";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { getTheme, setTheme, type Theme } from "@/lib/storage";

const nav: Array<{ to: string; id: string; label: MsgKey; icon: ComponentType<{ size: number; weight: "bold" }> }> = [
  { to: "/", id: "redeem", label: "nav.redeem", icon: Key },
  { to: "/orders", id: "orders", label: "nav.orders", icon: ListChecks },
  { to: "/cancel", id: "cancel", label: "nav.cancel", icon: Prohibit },
  { to: "/subscription", id: "sub", label: "nav.sub", icon: UserCircleCheck },
  { to: "/faq", id: "faq", label: "nav.faq", icon: Question },
];

export function AppShell() {
  const location = useLocation();
  const queue = useQueue();
  const { locale, setLocale, t } = useI18n();
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-[100dvh] text-foreground">
      <header className="app-header">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <NavLink
              className="group flex shrink-0 items-center gap-2.5 text-foreground"
              to="/"
            >
              <BrandLogo className="size-9 transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold tracking-tight">Jimi CDK</span>
            </NavLink>
            <nav className="hidden items-center gap-2 sm:flex">
              {nav.map((item) => {
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.id}
                    className={`button text-base ${active ? "button--secondary" : "button--ghost"}`}
                    end={item.to === "/"}
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
            {queue && (
              <Chip className="hidden md:inline-flex" size="lg" variant="soft">
                {t("nav.queue", { count: queue.pending_count })}
              </Chip>
            )}
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
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-3 sm:hidden">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.id}
                className={`button text-base ${active ? "button--secondary" : "button--ghost"}`}
                end={item.to === "/"}
                to={item.to}
              >
                <item.icon size={24} weight="bold" />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 md:py-16">
        <AnimatedOutlet />
      </main>
    </div>
  );
}
