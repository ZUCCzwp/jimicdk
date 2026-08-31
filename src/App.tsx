import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { AppShell } from "@/components/AppShell";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminPoolPage } from "@/pages/AdminPoolPage";
import { AdminCategoriesPage } from "@/pages/AdminCategoriesPage";
import { AdminProductsPage } from "@/pages/AdminProductsPage";
import { AdminTasksPage } from "@/pages/AdminTasksPage";
import { AdminNotificationsPage } from "@/pages/AdminNotificationsPage";
import { AdminReductionCodePage } from "@/pages/AdminReductionCodePage";
import { AccountPage } from "@/pages/AccountPage";
import { WalletReturnPage } from "@/pages/WalletReturnPage";
import { CancelPage } from "@/pages/CancelPage";
import { FaqPage } from "@/pages/FaqPage";
import { LoginPage } from "@/pages/LoginPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { RedeemPage } from "@/pages/RedeemPage";
import { ShopPage } from "@/pages/ShopPage";
import { ShopProductPage } from "@/pages/ShopProductPage";
import { CartPage } from "@/pages/CartPage";
import { LookupPage } from "@/pages/LookupPage";
import { ShopReturnPage } from "@/pages/ShopReturnPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="/" element={<RedeemPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
