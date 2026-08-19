export type PlanType = "plus" | "5x" | "20x";

export type TaskStatus =
  | "submitted"
  | "pending"
  | "paying"
  | "processing"
  | "await_confirm"
  | "manual_review"
  | "completed"
  | "failed";

export type VerifyCdkResp = {
  valid: boolean;
  plan_type?: PlanType;
  pending?: boolean;
  cancellable?: boolean;
  refresh_remaining?: number;
  code?: string;
  error?: string;
};

export type RefreshCdkResp = {
  message: string;
  old_code: string;
  new_code: string;
  plan_type: PlanType;
  refresh_remaining: number;
};

export type CreateTaskResp = {
  task_id: string;
  status: string;
  message: string;
  error?: string;
};

export type CancelTaskResp = {
  ok: boolean;
  message: string;
  plan_type: string;
};

export type TaskView = {
  task_id: string;
  cdk_code: string;
  plan_type: PlanType;
  account_email: string;
  task_status: TaskStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failure_reason?: string;
};

export type LookupTasksResp = {
  tasks: TaskView[];
};

export type QueueStatusResp = {
  status: string;
  pending_count: number;
  at: string;
};

export type AnnouncementResp = {
  enabled: boolean;
  content: string;
};

export type NotificationResp = {
  enabled: boolean;
  content: string;
};

export type SubscriptionSummary = {
  plan_type: string;
  subscription_plan: string;
  has_active_subscription: boolean;
  expires_at?: string;
  renews_at?: string;
  cancels_at?: string;
  will_renew: boolean;
  billing_currency?: string;
  billing_period?: string;
  purchase_origin_platform?: string;
  processor?: string;
  subscription_cancelled_detected: boolean;
};

export type CheckSubscriptionResp = {
  ok: boolean;
  summary?: SubscriptionSummary;
};

export type ApiErrorBody = {
  error: string;
  code?: string;
  error_code?: string;
  retry_after?: number;
  task_id?: string;
  status?: string;
};

export type AdminLoginResp = {
  token: string;
  expires_at: string;
  username: string;
};

export type AdminPlanStat = {
  plan_type: PlanType;
  stock: number;
  allocated: number;
  used: number;
  disabled: number;
  replaced: number;
  total: number;
};

export type AdminPoolResp = {
  plans: AdminPlanStat[];
};

export type AdminImportResp = {
  imported: number;
  skipped: number;
};

export type AdminAllocateResp = {
  plan_type: PlanType;
  codes: string[];
};

export type AdminCdkStatus = "available" | "used" | "disabled" | "replaced";

export type AdminCdkItem = {
  code: string;
  plan_type: PlanType;
  status: AdminCdkStatus;
  allocated: boolean;
  allocated_at?: string;
  created_at: string;
  updated_at: string;
  task_id?: string;
  task_status?: TaskStatus;
  account_email?: string;
  failure_reason?: string;
};

export type AdminListScope = "stock" | "allocated" | "used" | "all";

export type AdminListResp = {
  items: AdminCdkItem[];
};

export type UserProfile = {
  id: number;
  username: string;
  email?: string;
  display_name: string;
  wallet_cents: number;
  created_at: string;
};

export type UserAuthResp = {
  token: string;
  expires_at: string;
  user: UserProfile;
};

export type UserWalletRechargeItem = {
  order_no: string;
  amount_cents: number;
  status: "pending" | "paid" | string;
  created_at: string;
  paid_at?: string;
};

export type UserWalletResp = {
  balance_cents: number;
  auto_credit: boolean;
  min_cents: number;
  max_cents: number;
  recharges: UserWalletRechargeItem[];
};

export type UserRechargeResp = {
  order_no: string;
  amount_cents: number;
  status: string;
  credited: boolean;
  balance_cents: number;
  created_at: string;
};

export type ShopCategory = {
  id: number;
  slug: string;
  name: string;
};

export type ShopProduct = {
  id: number;
  category_id: number;
  slug: string;
  cover_url?: string;
  name: string;
  description: string;
  tags?: string[];
  plan_type: PlanType | string;
  price_cents: number;
  currency: string;
  stock: number;
};

export type AdminShopCategory = {
  id: number;
  slug: string;
  name_zh: string;
  name_en: string;
  sort: number;
};

export type AdminShopProduct = {
  id: number;
  category_id: number;
  slug: string;
  cover_url: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  tags: string[];
  plan_type: PlanType | string;
  price_cents: number;
  currency: string;
  stock: number;
  enabled: boolean;
  sort: number;
};

export type AdminShopCatalogResp = {
  categories: AdminShopCategory[];
  products: AdminShopProduct[];
};

export type ShopCatalogResp = {
  categories: ShopCategory[];
  products: ShopProduct[];
  stripe_on: boolean;
  currency: string;
};

export type ShopCheckoutResp = {
  order_no: string;
  claim: string;
  checkout_url: string;
};

export type ShopOrderResp = {
  order_no: string;
  claim: string;
  product_slug: string;
  plan_type: PlanType | string;
  quantity: number;
  amount_cents: number;
  currency: string;
  status: string;
  items?: ShopOrderLine[];
  codes?: string[];
  created_at: string;
  paid_at?: string;
};

export type ShopOrderLine = {
  product_id: number;
  product_slug: string;
  plan_type: PlanType | string;
  quantity: number;
  amount_cents: number;
};

export type ShopOrdersResp = {
  orders: ShopOrderResp[];
};

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  retryAfter?: number;
  taskId?: string;
  taskStatus?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error || "请求失败");
    this.name = "ApiError";
    this.status = status;
    this.errorCode = body.code || body.error_code;
    this.retryAfter = body.retry_after;
    this.taskId = body.task_id;
    this.taskStatus = body.status;
  }
}

export const PLAN_LABEL: Record<PlanType, string> = {
  plus: "Plus",
  "5x": "5x",
  "20x": "20x",
};

export function isTerminal(status: TaskStatus): boolean {
  return status === "completed" || status === "failed";
}

export function isCancellable(status: TaskStatus): boolean {
  return status === "submitted" || status === "pending";
}

export function isRefreshable(status?: TaskStatus): boolean {
  return !status || status === "failed";
}
