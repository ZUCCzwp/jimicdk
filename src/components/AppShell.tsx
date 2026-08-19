import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CaretDown,
  Key,
  List,
  ListChecks,
  MagnifyingGlass,
  Moon,
  Prohibit,
  Question,
  ShoppingCart,
  SignIn,
  SignOut,
  Storefront,
  Sun,
  Translate,
  User,
  UserCircleCheck,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { Alert, Button, Chip, Surface } from "@heroui/react";
import { useQueue } from "@/hooks/useApi";
import { useAnnouncement } from "@/hooks/useApi";
import { useNotifications } from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { cartCount, getCart, onCartChange, getTheme, setTheme, type Theme } from "@/lib/storage";
import FooterSocialLinks from "@/components/FooterSocialLinks";

type NavItem = { to: string; id: string; label: MsgKey; icon: ComponentType<{ size: number; weight: "bold" }> };

const nav: NavItem[] = [
  { to: "/shop", id: "shop", label: "nav.shop", icon: Storefront },
  { to: "/lookup", id: "lookup", label: "nav.lookup", icon: MagnifyingGlass },
  { to: "/", id: "redeem", label: "nav.redeem", icon: Key },
  { to: "/orders", id: "orders", label: "nav.orders", icon: ListChecks },
  { to: "/cancel", id: "cancel", label: "nav.cancel", icon: Prohibit },
  { to: "/subscription", id: "sub", label: "nav.sub", icon: UserCircleCheck },
  { to: "/faq", id: "faq", label: "nav.faq", icon: Question },
];

function itemActive(item: NavItem, pathname: string) {
  return item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
}

function navButtonClass(active: boolean) {
  return `button text-base ${active ? "button--secondary" : "button--ghost"}`;
}

type QueueLight = "green" | "yellow" | "red";

function queueLight(count: number): QueueLight {
  if (count <= 0) return "green";
  if (count <= 5) return "yellow";
  return "red";
}

function QueueTrafficLight({
  level,
  live,
  loading,
}: {
  level: QueueLight | null;
  live: boolean;
  loading?: boolean;
}) {
  if (loading || !level) {
    return (
      <span className="queue-light queue-light--loading" aria-hidden>
        <span className="queue-light__dot queue-light__dot--red" />
        <span className="queue-light__dot queue-light__dot--yellow is-on" />
        <span className="queue-light__dot queue-light__dot--green" />
      </span>
    );
  }

  return (
    <span className={`queue-light ${live ? "queue-light--live" : ""}`} aria-hidden>
      <span className={`queue-light__dot queue-light__dot--red ${level === "red" ? "is-on" : ""}`} />
      <span className={`queue-light__dot queue-light__dot--yellow ${level === "yellow" ? "is-on" : ""}`} />
      <span className={`queue-light__dot queue-light__dot--green ${level === "green" ? "is-on" : ""}`} />
    </span>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: queue, live: queueLive } = useQueue();
  const announcement = useAnnouncement();
  const notifications = useNotifications();
  const { user, logout } = useUser();
  const { locale, setLocale, t } = useI18n();
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [cartQty, setCartQty] = useState(() => cartCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => onCartChange(() => setCartQty(cartCount(getCart()))), []);

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

  const queueLevel = queue ? queueLight(queue.pending_count) : null;
  const queueHint =
    queueLevel === "green"
      ? t("nav.queueIdle")
      : queueLevel === "yellow"
        ? t("nav.queueModerate")
        : queueLevel === "red"
          ? t("nav.queueBusy")
          : "";

  return (
    <div className="min-h-[100dvh] text-foreground">
      <header className="app-header">
        <div className="app-header-inner grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8">
          <NavLink className="group flex shrink-0 items-center gap-2.5 justify-self-start text-foreground" to="/">
            <BrandLogo className="size-9 transition-transform group-hover:scale-110" />
            <span className="text-lg font-semibold tracking-tight">Viraltok CDK</span>
          </NavLink>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.id}
                className={navButtonClass(itemActive(item, location.pathname))}
                end={item.to === "/"}
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
                      end={item.to === "/"}
                      to={item.to}
                    >
                      <item.icon size={22} weight="bold" />
                      {t(item.label)}
                    </NavLink>
                  ))}
                </Surface>
              )}
            </div>

            <Chip
              className="hidden xl:inline-flex shrink-0"
              size="lg"
              title={
                queue && queueLevel
                  ? `${queueHint} · ${t("nav.queue", { count: queue.pending_count })}`
                  : t("nav.queueLoading")
              }
              variant="soft"
            >
              <span className="flex items-center gap-2">
                <QueueTrafficLight level={queueLevel} live={queueLive} loading={!queue} />
                <span className="queue-count">
                  {queue ? t("nav.queue", { count: queue.pending_count }) : t("nav.queueLoading")}
                </span>
              </span>
            </Chip>
            <NavLink
              className={`button relative shrink-0 text-base ${location.pathname === "/cart" ? "button--secondary" : "button--ghost"}`}
              to="/cart"
            >
              <ShoppingCart size={24} weight="bold" />
              <span className="hidden md:inline">{t("nav.cart")}</span>
              {cartQty > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[11px] font-bold text-[color:var(--accent-foreground)]">
                  {cartQty > 99 ? "99+" : cartQty}
                </span>
              )}
            </NavLink>
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
            {user ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  className={navButtonClass(userMenuOpen || location.pathname.startsWith("/account"))}
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <User size={24} weight="bold" />
                  <span className="hidden max-w-[10ch] truncate md:inline">
                    {user.display_name || user.username}
                  </span>
                  <CaretDown
                    className={`hidden transition-transform md:inline ${userMenuOpen ? "rotate-180" : ""}`}
                    size={16}
                    weight="bold"
                  />
                </button>
                {userMenuOpen && (
                  <Surface className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-44 rounded-2xl p-2">
                    <NavLink
                      className={`${navButtonClass(location.pathname.startsWith("/account"))} w-full justify-start`}
                      to="/account"
                    >
                      <User size={22} weight="bold" />
                      {t("nav.account")}
                    </NavLink>
                    <button
                      className={`${navButtonClass(false)} w-full justify-start`}
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate("/", { replace: true });
                      }}
                    >
                      <SignOut size={22} weight="bold" />
                      {t("account.logout")}
                    </button>
                  </Surface>
                )}
              </div>
            ) : (
              <NavLink
                className={`button shrink-0 text-base ${location.pathname.startsWith("/login") ? "button--secondary" : "button--ghost"}`}
                to="/login"
              >
                <SignIn size={24} weight="bold" />
                <span className="hidden md:inline">{t("nav.login")}</span>
              </NavLink>
            )}
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
          <Alert status="secondary">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("notifications.title")}</Alert.Title>
              <Alert.Description>{notifications.content}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <main
        className={
          location.pathname === "/login"
            ? "w-full"
            : "mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 md:py-16"
        }
      >
        <AnimatedOutlet />
      </main>
      <footer className={`app-footer ${location.pathname === "/login" ? "mt-0" : "mt-8"}`}>
        <div className="app-footer-inner relative mx-auto w-full max-w-6xl overflow-hidden px-5 py-14 text-sm sm:px-8">
          <div className="relative">
            <p aria-hidden="true" className="app-footer-watermark">
              VIRALTOK CDK
            </p>
            <div className="relative z-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <BrandLogo className="size-9" />
                <span className="text-lg font-bold tracking-tight text-foreground">Viraltok CDK</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                {locale === "zh"
                  ? "游客可浏览并使用 Stripe 支付。支付成功后会立即发放卡密。"
                  : "Guests can browse and pay with Stripe. After payment, codes are issued immediately."}
              </p>
              <FooterSocialLinks />
            </div>

            <div>
              <h4 className="footer-column-title">SHOP</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <NavLink className="footer-link" to="/shop">
                    {t("nav.shop")}
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">LOOKUP</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <NavLink className="footer-link" to="/lookup">
                    {t("nav.lookup")}
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">INFO</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <NavLink className="footer-link" to="/faq">
                    {t("nav.faq")}
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">ORDERS</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <NavLink className="footer-link" to="/orders">
                    {t("nav.orders")}
                  </NavLink>
                </li>
                <li>
                  <NavLink className="footer-link" to="/cancel">
                    {t("nav.cancel")}
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-column-title">ACCOUNT</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <NavLink className="footer-link" to="/subscription">
                    {t("nav.sub")}
                  </NavLink>
                </li>
                <li>
                  <NavLink className="footer-link" to="/account">
                    {t("nav.account")}
                  </NavLink>
                </li>
              </ul>
            </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row sm:items-center">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} Viraltok CDK. All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <button
                className="footer-toggle-btn"
                type="button"
                aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
                onClick={() => setThemeState(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
              </button>
              <button
                className="footer-toggle-btn footer-toggle-btn--lang"
                type="button"
                aria-label={locale === "zh" ? t("lang.toEn") : t("lang.toZh")}
                onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              >
                <Translate size={18} weight="bold" />
                <span className="ml-1">{locale === "zh" ? "中文" : "EN"}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
