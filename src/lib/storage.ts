const ORDERS = "jimicdk.orders";
const THEME = "jimicdk.theme";
const LOCALE = "jimicdk.locale";

export type StoredOrder = {
  cdkCode: string;
  taskId?: string;
  addedAt: string;
};

export function getOrders(): StoredOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS);
    return raw ? (JSON.parse(raw) as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

export function upsertOrder(order: StoredOrder): StoredOrder[] {
  const next = getOrders().filter((o) => o.cdkCode !== order.cdkCode);
  next.unshift(order);
  localStorage.setItem(ORDERS, JSON.stringify(next.slice(0, 100)));
  return next;
}

export function removeOrder(cdkCode: string): StoredOrder[] {
  const next = getOrders().filter((o) => o.cdkCode !== cdkCode);
  localStorage.setItem(ORDERS, JSON.stringify(next));
  return next;
}

export function replaceOrder(oldCode: string, newCode: string): StoredOrder[] {
  const current = getOrders();
  const old = current.find((o) => o.cdkCode === oldCode);
  const next = current.filter((o) => o.cdkCode !== oldCode && o.cdkCode !== newCode);
  next.unshift({
    cdkCode: newCode,
    taskId: old?.taskId,
    addedAt: old?.addedAt ?? new Date().toISOString(),
  });
  localStorage.setItem(ORDERS, JSON.stringify(next.slice(0, 100)));
  return next;
}

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  const saved = localStorage.getItem(THEME);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME, theme);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export type Locale = "zh" | "en";

export function getLocale(): Locale {
  const saved = localStorage.getItem(LOCALE);
  if (saved === "zh" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE, locale);
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
}

const ADMIN = "jimicdk.admin";

export type AdminSession = {
  token: string;
  username: string;
  expiresAt: string;
};

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.token || !session.username) return null;
    if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(ADMIN);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  sessionStorage.setItem(ADMIN, JSON.stringify(session));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN);
}
