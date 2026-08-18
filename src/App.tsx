import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { AppShell } from "@/components/AppShell";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminPoolPage } from "@/pages/AdminPoolPage";
import { AdminTasksPage } from "@/pages/AdminTasksPage";
import { CancelPage } from "@/pages/CancelPage";
import { FaqPage } from "@/pages/FaqPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { RedeemPage } from "@/pages/RedeemPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminShell />} path="/admin">
          <Route index element={<AdminPoolPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="/" element={<RedeemPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
