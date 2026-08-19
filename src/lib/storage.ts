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
const USER = "jimicdk.user";

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

export type UserSession = {
  token: string;
  expiresAt: string;
  user: {
    id: number;
    username: string;
    display_name: string;
    wallet_cents: number;
    created_at: string;
  };
};

export function getUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    const session = JSON.parse(raw) as UserSession;
    if (!session.token || !session.user?.username) return null;
    if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
      localStorage.removeItem(USER);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  localStorage.removeItem(USER);
  window.dispatchEvent(new Event("jimicdk-user-changed"));
}

export function setUserSession(session: UserSession): void {
  localStorage.setItem(USER, JSON.stringify(session));
  window.dispatchEvent(new Event("jimicdk-user-changed"));
}

const PURCHASES = "jimicdk.purchases";

export type StoredPurchase = {
  orderNo: string;
  claim: string;
  productSlug: string;
  codes: string[];
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string;
};

export function getPurchases(): StoredPurchase[] {
  try {
    const raw = localStorage.getItem(PURCHASES);
    return raw ? (JSON.parse(raw) as StoredPurchase[]) : [];
  } catch {
    return [];
  }
}

export function upsertPurchase(purchase: StoredPurchase): StoredPurchase[] {
  const next = getPurchases().filter((item) => item.orderNo !== purchase.orderNo);
  next.unshift(purchase);
  localStorage.setItem(PURCHASES, JSON.stringify(next.slice(0, 50)));
  return next;
}

const CART = "jimicdk.cart";
const CART_CHANGED = "jimicdk-cart-changed";

export type CartItem = {
  productId: number;
  quantity: number;
};

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART);
    const list = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return list.filter((item) => item.productId > 0 && item.quantity > 0);
  } catch {
    return [];
  }
}

export function cartCount(items = getCart()): number {
  return items.reduce((n, item) => n + item.quantity, 0);
}

function persistCart(items: CartItem[]): CartItem[] {
  const next = items.filter((item) => item.quantity > 0).slice(0, 10);
  localStorage.setItem(CART, JSON.stringify(next));
  window.dispatchEvent(new Event(CART_CHANGED));
  return next;
}

export function setCart(items: CartItem[]): CartItem[] {
  return persistCart(items);
}

export type AddToCartResult =
  | { ok: true; items: CartItem[] }
  | { ok: false; reason: "stock"; stock: number; inCart: number; remaining: number };

export function addToCart(productId: number, quantity: number, stock: number): AddToCartResult {
  const qty = Math.min(5, Math.max(1, quantity));
  const maxStock = Math.max(0, Math.floor(stock));
  const current = getCart();
  const found = current.find((item) => item.productId === productId);
  const inCart = found?.quantity ?? 0;
  const remaining = Math.max(0, Math.min(5, maxStock) - inCart);

  if (qty > remaining) {
    return { ok: false, reason: "stock", stock: maxStock, inCart, remaining };
  }

  if (found) {
    found.quantity = inCart + qty;
    return { ok: true, items: persistCart(current) };
  }
  current.push({ productId, quantity: qty });
  return { ok: true, items: persistCart(current) };
}

export function updateCartQty(productId: number, quantity: number, stock = 5): CartItem[] {
  if (quantity < 1) {
    return persistCart(getCart().filter((item) => item.productId !== productId));
  }
  const maxQty = Math.min(5, Math.max(0, Math.floor(stock)));
  return persistCart(
    getCart().map((item) =>
      item.productId === productId ? { ...item, quantity: Math.min(maxQty, quantity) } : item,
    ),
  );
}

export function clearCart(): CartItem[] {
  return persistCart([]);
}

export function onCartChange(fn: () => void): () => void {
  window.addEventListener(CART_CHANGED, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(CART_CHANGED, fn);
    window.removeEventListener("storage", fn);
  };
}
