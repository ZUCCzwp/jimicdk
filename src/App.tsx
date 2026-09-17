import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { AppShell } from "@/components/AppShell";

const AdminLoginPage = lazy(() =>
  import("@/pages/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })),
);
const AdminPoolPage = lazy(() =>
  import("@/pages/AdminPoolPage").then((m) => ({ default: m.AdminPoolPage })),
);
const AdminCategoriesPage = lazy(() =>
  import("@/pages/AdminCategoriesPage").then((m) => ({ default: m.AdminCategoriesPage })),
);
const AdminProductsPage = lazy(() =>
  import("@/pages/AdminProductsPage").then((m) => ({ default: m.AdminProductsPage })),
);
const AdminTasksPage = lazy(() =>
  import("@/pages/AdminTasksPage").then((m) => ({ default: m.AdminTasksPage })),
);
const AdminNotificationsPage = lazy(() =>
  import("@/pages/AdminNotificationsPage").then((m) => ({ default: m.AdminNotificationsPage })),
);
const AdminReductionCodePage = lazy(() =>
  import("@/pages/AdminReductionCodePage").then((m) => ({ default: m.AdminReductionCodePage })),
);
const AccountPage = lazy(() =>
  import("@/pages/AccountPage").then((m) => ({ default: m.AccountPage })),
);
const WalletReturnPage = lazy(() =>
  import("@/pages/WalletReturnPage").then((m) => ({ default: m.WalletReturnPage })),
);
const CancelPage = lazy(() =>
  import("@/pages/CancelPage").then((m) => ({ default: m.CancelPage })),
);
const FaqPage = lazy(() => import("@/pages/FaqPage").then((m) => ({ default: m.FaqPage })));
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const OrdersPage = lazy(() =>
  import("@/pages/OrdersPage").then((m) => ({ default: m.OrdersPage })),
);
const RedeemPage = lazy(() =>
  import("@/pages/RedeemPage").then((m) => ({ default: m.RedeemPage })),
);
const ShopPage = lazy(() => import("@/pages/ShopPage").then((m) => ({ default: m.ShopPage })));
const ShopProductPage = lazy(() =>
  import("@/pages/ShopProductPage").then((m) => ({ default: m.ShopProductPage })),
);
const CartPage = lazy(() => import("@/pages/CartPage").then((m) => ({ default: m.CartPage })));
const LookupPage = lazy(() =>
  import("@/pages/LookupPage").then((m) => ({ default: m.LookupPage })),
);
const ShopReturnPage = lazy(() =>
  import("@/pages/ShopReturnPage").then((m) => ({ default: m.ShopReturnPage })),
);
const SubscriptionPage = lazy(() =>
  import("@/pages/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm text-muted" aria-busy="true">
      …
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminShell />} path="/admin">
            <Route index element={<AdminPoolPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="tasks" element={<AdminTasksPage />} />
            <Route path="reduction-code" element={<AdminReductionCodePage />} />
          </Route>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/shop" replace />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/shop/return" element={<ShopReturnPage />} />
            <Route path="/shop/:slug" element={<ShopProductPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/lookup" element={<LookupPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/cancel" element={<CancelPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account/wallet/return" element={<WalletReturnPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/shop" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
