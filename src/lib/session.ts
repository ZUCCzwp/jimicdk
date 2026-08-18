import type { MsgKey } from "@/i18n/messages";

type SessionFields = {
  email: string;
  plan: string;
};

export type SessionIssue = { key: MsgKey; vars?: Record<string, string> };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function str(obj: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function readSession(raw: string): { ok: true; data: SessionFields } | { ok: false; issue: SessionIssue } {
  const text = raw.trim();
  if (!text) return { ok: false, issue: { key: "session.empty" } };
  try {
    const obj = JSON.parse(text) as Record<string, unknown>;
    const token = str(obj, "accessToken", "access_token");
    if (!token) return { ok: false, issue: { key: "session.missingToken" } };
    const user = asRecord(obj.user);
    const account = asRecord(obj.account);
    const email = str(obj, "email") || str(user, "email", "emailAddress") || str(account, "email");
    if (!email) return { ok: false, issue: { key: "session.missingEmail" } };
    const plan = str(obj, "planType", "plan_type") || str(user, "planType", "plan_type") || str(account, "planType", "plan_type");
    if (!plan) return { ok: false, issue: { key: "session.missingPlan" } };
    if (plan.toLowerCase() !== "free") {
      return { ok: false, issue: { key: "session.notFree", vars: { plan } } };
    }
    return { ok: true, data: { email, plan } };
  } catch {
    return { ok: false, issue: { key: "session.invalidJson" } };
  }
}

export function sessionIssue(raw: string): SessionIssue | null {
  const parsed = readSession(raw);
  return parsed.ok ? null : parsed.issue;
}

export function sessionEmail(raw: string): string | null {
  const parsed = readSession(raw);
  return parsed.ok ? parsed.data.email : null;
}
