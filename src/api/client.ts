import { clearAdminSession, clearUserSession, getAdminSession, getLocale, getUserSession } from "@/lib/storage";
import {
  ApiError,
  type AdminAllocateResp,
  type AdminImportResp,
  type AdminListResp,
  type AdminListScope,
  type AdminLoginResp,
  type AdminPoolResp,
  type AdminShopCatalogResp,
  type AdminShopProduct,
  type AnnouncementResp,
  type ApiErrorBody,
  type CancelTaskResp,
  type CheckSubscriptionResp,
  type CreateTaskResp,
  type LookupTasksResp,
  type PlanType,
  type QueueStatusResp,
  type RefreshCdkResp,
  type TaskView,
  type UserAuthResp,
  type UserProfile,
  type UserRechargeResp,
  type ShopCatalogResp,
  type ShopCheckoutResp,
  type ShopOrderResp,
  type ShopOrdersResp,
  type UserWalletResp,
  type VerifyCdkResp,
	type NotificationResp,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "/api/v1";

export function apiBase() {
  return BASE.replace(/\/$/, "");
}

type RequestOpts = RequestInit & { auth?: boolean; user?: boolean | "optional" };

async function request<T>(path: string, init: RequestOpts = {}): Promise<T> {
  const { auth, user, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getLocale() === "en" ? "en" : "zh-CN");
  }
  if (auth) {
    const session = getAdminSession();
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  } else if (user) {
    const session = getUserSession();
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T | ApiErrorBody) : {};

  if (!res.ok) {
    const err = new ApiError(res.status, (data as ApiErrorBody) ?? { error: res.statusText });
    if (auth && (err.status === 401 || err.errorCode === "invalid_admin_token")) {
      clearAdminSession();
    }
    if (user === true && (err.status === 401 || err.errorCode === "invalid_user_token")) {
      clearUserSession();
    }
    throw err;
  }
  return data as T;
}

export const api = {
  verifyCdk(cdkCode: string) {
    return request<VerifyCdkResp>("/recharge/verify-cdk", {
      method: "POST",
      body: JSON.stringify({ cdk_code: cdkCode }),
    });
  },
  createTask(cdkCode: string, sessionJson: string) {
    return request<CreateTaskResp>("/recharge/create-task", {
      method: "POST",
      user: "optional",
      body: JSON.stringify({ cdk_code: cdkCode, session_json: sessionJson }),
    });
  },
  cancelTask(cdkCode: string) {
    return request<CancelTaskResp>("/recharge/cancel-task", {
      method: "POST",
      user: "optional",
      body: JSON.stringify({ cdk_code: cdkCode }),
    });
  },
  refreshCdk(cdkCode: string) {
    return request<RefreshCdkResp>("/recharge/refresh-cdk", {
      method: "POST",
      user: "optional",
      body: JSON.stringify({ cdk_code: cdkCode }),
    });
  },
  lookupTask(cdkCode: string) {
    return request<TaskView>(`/lookup/task?cdk_code=${encodeURIComponent(cdkCode)}`);
  },
  lookupTasks(codes: string[]) {
    return request<LookupTasksResp>("/lookup/tasks", {
      method: "POST",
      body: JSON.stringify({ codes }),
    });
  },
  queueEventsUrl() {
    return `${apiBase()}/recharge/queue-events`;
  },
  queueStatus() {
    return request<QueueStatusResp>("/recharge/queue-status");
  },
  announcement() {
    return request<AnnouncementResp>("/announcement");
  },
  notifications() {
    return request<NotificationResp>("/notifications");
  },
  checkSubscription(tokenInput: string) {
    return request<CheckSubscriptionResp>("/recharge/check-subscription", {
      method: "POST",
      body: JSON.stringify({ token_input: tokenInput }),
    });
  },
  adminLogin(username: string, password: string) {
    return request<AdminLoginResp>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  adminPool() {
    return request<AdminPoolResp>("/admin/pool", { auth: true });
  },
  adminImport(planType: PlanType, raw: string) {
    return request<AdminImportResp>("/admin/cdks/import", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ plan_type: planType, raw }),
    });
  },
  adminAllocate(planType: PlanType, count: number) {
    return request<AdminAllocateResp>("/admin/cdks/allocate", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ plan_type: planType, count }),
    });
  },
  adminList(opts: { planType?: PlanType | ""; scope?: AdminListScope; q?: string; limit?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.planType) params.set("plan_type", opts.planType);
    if (opts.scope) params.set("scope", opts.scope);
    if (opts.q) params.set("q", opts.q);
    params.set("limit", String(opts.limit ?? 100));
    return request<AdminListResp>(`/admin/cdks?${params}`, { auth: true });
  },
  adminTasks(opts: { planType?: PlanType | ""; status?: string; q?: string; limit?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.planType) params.set("plan_type", opts.planType);
    if (opts.status) params.set("status", opts.status);
    if (opts.q) params.set("q", opts.q);
    params.set("limit", String(opts.limit ?? 100));
    return request<LookupTasksResp>(`/admin/tasks?${params}`, { auth: true });
  },
  adminShopCatalog() {
    return request<AdminShopCatalogResp>("/admin/shop/catalog", { auth: true });
  },
  adminShopCreateProduct(body: Partial<AdminShopProduct> & Pick<AdminShopProduct, "category_id" | "name_zh" | "plan_type" | "price_cents">) {
    return request<AdminShopProduct>("/admin/shop/products", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    });
  },
  adminShopUpdateProduct(id: number, body: Partial<AdminShopProduct> & Pick<AdminShopProduct, "category_id" | "name_zh" | "plan_type" | "price_cents">) {
    return request<AdminShopProduct>(`/admin/shop/products/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    });
  },
  adminShopDeleteProduct(id: number) {
    return request<{ ok: boolean }>(`/admin/shop/products/${id}`, { method: "DELETE", auth: true });
  },
  adminShopCreateCategory(body: { name_zh: string; name_en?: string; slug?: string; sort?: number }) {
    return request<AdminShopCatalogResp["categories"][number]>("/admin/shop/categories", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    });
  },
  adminShopUpdateCategory(id: number, body: { name_zh: string; name_en?: string; slug?: string; sort?: number }) {
    return request<AdminShopCatalogResp["categories"][number]>(`/admin/shop/categories/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    });
  },
  adminShopDeleteCategory(id: number) {
    return request<{ ok: boolean }>(`/admin/shop/categories/${id}`, { method: "DELETE", auth: true });
  },
  adminUpdateNotifications(body: { enabled: boolean; content: string }) {
    return request<NotificationResp>("/admin/notifications", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(body),
    });
  },
  async adminShopUpload(file: File) {
    const session = getAdminSession();
    const form = new FormData();
    form.append("file", file);
    const headers = new Headers();
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
    const res = await fetch(`${BASE}/admin/shop/upload`, { method: "POST", body: form, headers });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as { url: string } | ApiErrorBody) : {};
    if (!res.ok) {
      const err = new ApiError(res.status, (data as ApiErrorBody) ?? { error: res.statusText });
      if (err.status === 401 || err.errorCode === "invalid_admin_token") {
        clearAdminSession();
      }
      throw err;
    }
    return data as { url: string };
  },
  userSendCode(email: string) {
    return request<{ ok: boolean; dev_code?: string }>("/user/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  userRegister(email: string, password: string, code: string, displayName?: string) {
    return request<UserAuthResp>("/user/register", {
      method: "POST",
      body: JSON.stringify({ email, password, code, display_name: displayName ?? "" }),
    });
  },
  userLogin(email: string, password: string) {
    return request<UserAuthResp>("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  userMe() {
    return request<UserProfile>("/user/me", { user: true });
  },
  userUpdateMe(displayName: string) {
    return request<UserProfile>("/user/me", {
      method: "PUT",
      user: true,
      body: JSON.stringify({ display_name: displayName }),
    });
  },
  userOrders() {
    return request<LookupTasksResp>("/user/orders", { user: true });
  },
  userWallet() {
    return request<UserWalletResp>("/user/wallet", { user: true });
  },
  userRecharge(amountCents: number) {
    return request<UserRechargeResp>("/user/wallet/recharge", {
      method: "POST",
      user: true,
      body: JSON.stringify({ amount_cents: amountCents }),
    });
  },
  shopCatalog() {
    return request<ShopCatalogResp>("/shop/catalog");
  },
  shopCheckout(items: Array<{ productId: number; quantity: number }>, opts?: { email?: string; claim?: string }) {
    return request<ShopCheckoutResp>("/shop/checkout", {
      method: "POST",
      user: "optional",
      body: JSON.stringify({
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        email: opts?.email ?? "",
        claim: opts?.claim ?? "",
      }),
    });
  },
  shopConfirm(orderNo: string, claim: string, sessionId?: string) {
    return request<ShopOrderResp>("/shop/confirm", {
      method: "POST",
      body: JSON.stringify({ order_no: orderNo, claim, session_id: sessionId ?? "" }),
    });
  },
  shopOrder(orderNo: string, claim: string) {
    const params = new URLSearchParams({ order_no: orderNo, claim });
    return request<ShopOrderResp>(`/shop/order?${params}`);
  },
  shopQuery(orderNo: string, opts: { email?: string; claim?: string } = {}) {
    return request<ShopOrderResp>("/shop/query", {
      method: "POST",
      body: JSON.stringify({ order_no: orderNo, email: opts.email ?? "", claim: opts.claim ?? "" }),
    });
  },
  shopMine() {
    return request<ShopOrdersResp>("/shop/mine", { user: true });
  },
};
