import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "@/api/types";
import { getLocale, setLocale as persistLocale, type Locale } from "@/lib/storage";
import { en, zh, type MsgKey } from "./messages";

const catalog = { zh, en } as const;

const byCode: Record<string, MsgKey> = {
  cdk_not_found: "api.cdkNotFound",
  cdk_replaced: "api.cdkReplaced",
  cdk_not_refreshable: "api.cdkNotRefreshable",
  refresh_limit_reached: "api.refreshLimit",
  refresh_conflict: "api.refreshConflict",
  no_task: "api.noTask",
  manual_review: "api.manualReview",
  completed: "api.completedNoCancel",
  failed: "api.failedNoCancel",
  already_running: "api.alreadyRunning",
  rate_limited: "api.rateLimited",
  invalid_api_key: "api.invalidKey",
  query_failed: "api.queryFailed",
  token_invalid: "api.tokenInvalid",
  invalid_credentials: "api.invalidCredentials",
  invalid_admin_token: "api.invalidAdminToken",
  invalid_user_token: "api.invalidUserToken",
  admin_disabled: "api.adminDisabled",
  user_disabled: "api.userDisabled",
  username_taken: "api.usernameTaken",
  email_taken: "api.emailTaken",
  invalid_email: "api.invalidEmail",
  need_email: "shop.needGuestEmail",
  need_claim: "shop.needGuestClaim",
  invalid_claim_format: "shop.claimInvalid",
  invalid_code: "api.invalidCode",
  code_cooldown: "api.codeCooldown",
  invalid_password: "api.invalidPassword",
  stock_not_enough: "api.stockNotEnough",
  stripe_disabled: "api.stripeDisabled",
  invalid_claim: "shop.invalidClaim",
};

const byMessage: Record<string, MsgKey> = {
  "CDK不存在": "api.cdkNotFound",
  "CDK已禁用": "api.cdkDisabled",
  "CDK已被使用": "api.cdkUsed",
  "CDK不可用": "verify.unavailable",
  "该卡密已有处理中任务": "api.cdkBusy",
  "任务已完成，卡密不可再次提交": "api.alreadyDone",
  "充值申请已提交，请等待处理": "api.created",
  "已取消排队中的任务，卡密可以重新提交": "api.cancelled",
  "该卡密当前没有排队中的任务": "api.noTask",
  "任务已转人工处理，请联系客服": "api.manualReview",
  "任务已完成，无法取消": "api.completedNoCancel",
  "上次任务已失败，该卡密可直接重新提交，不需要取消": "api.failedNoCancel",
  "任务已经开始处理，无法取消": "api.alreadyRunning",
  "当前状态不支持取消": "api.cancelUnsupported",
  "该卡密正在处理中，请稍候": "verify.pending",
  "该卡密已更换，请使用换码时拿到的新卡密": "api.cdkReplaced",
  "该卡密当前不可换码": "api.cdkNotRefreshable",
  "任务已完成，无法换码": "api.cdkNotRefreshable",
  "换码次数已用完": "api.refreshLimit",
  "并发换码已被别的请求抢先完成，需重新查询": "api.refreshConflict",
  "卡密不可用": "verify.unavailable",
  "请求过于频繁": "api.rateLimitedShort",
  "上游查询失败，请稍后重试": "api.queryFailed",
  "内部错误": "api.internal",
  "API Key 无效或已停用": "api.invalidKey",
  "请求失败": "api.failed",
  "用户名或密码错误": "api.invalidCredentials",
  "邮箱或密码错误": "api.invalidCredentials",
  "登录已失效，请重新登录": "api.invalidUserToken",
  "请先登录管理后台": "api.invalidAdminToken",
  "请先登录": "api.pleaseLogin",
  "管理后台未启用": "api.adminDisabled",
  "用户系统未启用": "api.userDisabled",
  "该用户名已被注册": "api.usernameTaken",
  "该邮箱已注册": "api.emailTaken",
  "用户名需 3–32 位，字母开头，仅字母数字和下划线": "api.invalidUsername",
  "密码至少 8 位": "api.invalidPassword",
  "昵称最多 32 个字符": "api.invalidDisplayName",
  "验证码错误": "api.invalidCode",
  "请先获取验证码": "api.needCode",
  "验证码发送过于频繁": "api.codeCooldown",
  "发送验证码失败": "api.sendCodeFailed",
  "充值金额需为 10–5000 美元的整数": "api.invalidAmount",
  "请输入至少一张兑换码": "admin.importEmpty",
  "Stripe 支付未配置": "api.stripeDisabled",
  "库存不足": "api.stockNotEnough",
  "库存不足，付款后请联系客服补发": "api.stockNotEnough",
  "创建支付失败，请稍后重试": "shop.checkoutFailed",
  "商品不存在": "shop.notFound",
  "邮箱格式不正确": "shop.invalidEmail",
  "游客下单请填写邮箱": "shop.needGuestEmail",
  "游客下单请设置取件码": "shop.needGuestClaim",
  "取件码长度需为 4–32 位": "shop.claimInvalid",
  "取件码不能包含空格": "shop.claimInvalid",
  "取件码仅支持字母、数字和常见符号": "shop.claimInvalid",
  "单次最多购买 5 张": "shop.maxQty",
  "支付尚未完成": "shop.return.unpaid",
  "缺少订单信息": "shop.return.missing",
  "订单不存在": "shop.orderNotFound",
  "订单不存在或信息不匹配": "shop.orderNotFound",
  "请填写取件码或下单邮箱": "shop.queryNeed",
  "请选择商品": "shop.cartEmpty",
  "购物车商品过多": "shop.maxQty",
  "无权查看该订单": "shop.invalidClaim",
};

type Vars = Record<string, string | number>;

export type TFn = (key: MsgKey, vars?: Vars) => string;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
  tb: (message?: string, code?: string, retryAfter?: number) => string;
  te: (err: unknown, fallback: MsgKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? `{${name}}` : String(vars[name]),
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const t = useCallback<TFn>(
    (key, vars) => interpolate(catalog[locale][key] ?? catalog.zh[key], vars),
    [locale],
  );

  const tb = useCallback(
    (message?: string, code?: string, retryAfter?: number) => {
      if (code === "rate_limited") {
        return t("api.rateLimited", { sec: retryAfter && retryAfter > 0 ? retryAfter : 1 });
      }
      if (code === "refresh_cooldown") {
        return t("api.refreshCooldown", { sec: retryAfter && retryAfter > 0 ? retryAfter : 1 });
      }
      if (code === "code_cooldown") {
        return t("api.codeCooldown", { sec: retryAfter && retryAfter > 0 ? retryAfter : 60 });
      }
      const key = (code && byCode[code]) || (message ? byMessage[message] : undefined);
      if (key) return t(key);
      return message || t("api.failed");
    },
    [t],
  );

  const te = useCallback(
    (err: unknown, fallback: MsgKey) => {
      if (err instanceof ApiError) return tb(err.message, err.errorCode, err.retryAfter);
      return t(fallback);
    },
    [t, tb],
  );

  const value = useMemo(
    () => ({ locale, setLocale: setLocaleState, t, tb, te }),
    [locale, t, tb, te],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
