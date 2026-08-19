import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CaretDown,
  FolderOpen,
  List,
  ListChecks,
  Megaphone,
  Moon,
  Package,
  SignOut,
  Stack,
  Sun,
  Translate,
  User,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { BrandLogo } from "@/components/BrandLogo";
import { Alert, Button, Surface } from "@heroui/react";
import { useAnnouncement } from "@/hooks/useApi";
import { useNotifications } from "@/hooks/useApi";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { clearAdminSession, getAdminSession, getTheme, setTheme, type Theme } from "@/lib/storage";

type NavItem = {
  to: string;
  id: string;
  label: MsgKey;
  end?: boolean;
  icon: ComponentType<{ size: number; weight: "bold" }>;
};

const nav: NavItem[] = [
  { to: "/admin", id: "pool", label: "admin.nav.pool", icon: Stack, end: true },
  { to: "/admin/categories", id: "categories", label: "admin.nav.categories", icon: FolderOpen },
  { to: "/admin/products", id: "products", label: "admin.nav.products", icon: Package },
  { to: "/admin/tasks", id: "tasks", label: "admin.nav.tasks", icon: ListChecks },
  { to: "/admin/notifications", id: "notifications", label: "admin.nav.notifications", icon: Megaphone },
];

function itemActive(item: NavItem, pathname: string) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function navButtonClass(active: boolean) {
  return `button text-base ${active ? "button--secondary" : "button--ghost"}`;
}

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const announcement = useAnnouncement();
  const notifications = useNotifications();
  const { locale, setLocale, t } = useI18n();
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const session = getAdminSession();

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen && !userMenuOpen) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (menuOpen && !menuRef.current?.contains(target)) setMenuOpen(false);
      if (userMenuOpen && !userMenuRef.current?.contains(target)) setUserMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen, userMenuOpen]);

  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin/login" />;
  }

  function onLogout() {
    clearAdminSession();
    setUserMenuOpen(false);
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-[100dvh] text-foreground">
      <header className="app-header">
        <div className="app-header-inner grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8">
          <NavLink className="group flex shrink-0 items-center gap-2.5 justify-self-start text-foreground" to="/admin">
            <BrandLogo className="size-9 transition-transform group-hover:scale-110" />
            <span className="text-lg font-semibold tracking-tight">{t("admin.brand")}</span>
          </NavLink>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.id}
                className={navButtonClass(itemActive(item, location.pathname))}
                end={item.end}
                to={item.to}
              >
                <item.icon size={24} weight="bold" />
                {t(item.label)}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end justify-self-end gap-1 sm:gap-2">
            <div className="relative lg:hidden" ref={menuRef}>
              <button
                aria-label={t("nav.menu")}
                className={navButtonClass(menuOpen)}
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <List size={24} weight="bold" />
                <span className="hidden sm:inline">{t("nav.menu")}</span>
              </button>
              {menuOpen && (
                <Surface className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-52 rounded-2xl p-2">
                  {nav.map((item) => (
                    <NavLink
                      key={item.id}
                      className={`${navButtonClass(itemActive(item, location.pathname))} w-full justify-start`}
                      end={item.end}
                      to={item.to}
                    >
                      <item.icon size={22} weight="bold" />
                      {t(item.label)}
                    </NavLink>
                  ))}
                </Surface>
              )}
            </div>

            <Button
              aria-label={locale === "zh" ? t("lang.toEn") : t("lang.toZh")}
              className="shrink-0"
              size="lg"
              variant="ghost"
              onPress={() => setLocale(locale === "zh" ? "en" : "zh")}
            >
              <Translate size={20} weight="bold" />
              <span className="hidden md:inline">{locale === "zh" ? "EN" : "中"}</span>
            </Button>
            <Button
              isIconOnly
              aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
              className="shrink-0"
              size="lg"
              variant="ghost"
              onPress={() => setThemeState(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={24} weight="bold" /> : <Moon size={24} weight="bold" />}
            </Button>

            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                className={navButtonClass(userMenuOpen)}
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <User size={24} weight="bold" />
                <span className="hidden max-w-[10ch] truncate md:inline">{session.username}</span>
                <CaretDown
                  className={`hidden transition-transform md:inline ${userMenuOpen ? "rotate-180" : ""}`}
                  size={16}
                  weight="bold"
                />
              </button>
              {userMenuOpen && (
                <Surface className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-44 rounded-2xl p-2">
                  <button
                    className={`${navButtonClass(false)} w-full justify-start`}
                    type="button"
                    onClick={onLogout}
                  >
                    <SignOut size={22} weight="bold" />
                    {t("admin.logout")}
                  </button>
                </Surface>
              )}
            </div>
          </div>
        </div>
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
      {notifications?.enabled && notifications.content && (
        <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
          <Alert status="default">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("notifications.title")}</Alert.Title>
              <Alert.Description>{notifications.content}</Alert.Description>
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
