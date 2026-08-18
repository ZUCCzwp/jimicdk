import { clearAdminSession, getAdminSession } from "@/lib/storage";
import {
  ApiError,
  type AdminAllocateResp,
  type AdminImportResp,
  type AdminListResp,
  type AdminListScope,
  type AdminLoginResp,
  type AdminPoolResp,
  type AnnouncementResp,
  type ApiErrorBody,
  type CancelTaskResp,
  type CheckSubscriptionResp,
  type CreateTaskResp,
  type LookupTasksResp,
  type PlanType,
  type RefreshCdkResp,
  type TaskView,
  type VerifyCdkResp,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "/api/v1";

export function apiBase() {
  return BASE.replace(/\/$/, "");
}

type RequestOpts = RequestInit & { auth?: boolean };

async function request<T>(path: string, init: RequestOpts = {}): Promise<T> {
  const { auth, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const session = getAdminSession();
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
      body: JSON.stringify({ cdk_code: cdkCode, session_json: sessionJson }),
    });
  },
  cancelTask(cdkCode: string) {
    return request<CancelTaskResp>("/recharge/cancel-task", {
      method: "POST",
      body: JSON.stringify({ cdk_code: cdkCode }),
    });
  },
  refreshCdk(cdkCode: string) {
    return request<RefreshCdkResp>("/recharge/refresh-cdk", {
      method: "POST",
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
  announcement() {
    return request<AnnouncementResp>("/announcement");
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
};
