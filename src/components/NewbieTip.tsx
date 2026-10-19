import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, X } from "@phosphor-icons/react";
import { Button } from "@heroui/react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";

export type NewbieTipPage = "shop" | "cart" | "redeem" | "lookup" | "orders" | "guide";

const TIP_KEYS: Record<NewbieTipPage, MsgKey> = {
  shop: "newbie.tip.shop",
  cart: "newbie.tip.cart",
  redeem: "newbie.tip.redeem",
  lookup: "newbie.tip.lookup",
  orders: "newbie.tip.orders",
  guide: "newbie.tip.guide",
};

const NEXT: Partial<Record<NewbieTipPage, { to: string; label: MsgKey }>> = {
  shop: { to: "/cart", label: "nav.cart" },
  cart: { to: "/guide", label: "nav.guide" },
  redeem: { to: "/guide", label: "nav.guide" },
  lookup: { to: "/redeem", label: "nav.redeem" },
  orders: { to: "/redeem", label: "nav.redeem" },
  guide: { to: "/shop", label: "guidePage.goShop" },
};

type Props = {
  page: NewbieTipPage;
  className?: string;
};

export function NewbieTip({ page, className = "" }: Props) {
  const { t } = useI18n();
  const { isNewbie, markExperienced } = useOnboarding();
  const next = NEXT[page];

  if (!isNewbie) return null;

  return (
    <aside
      className={`flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 ${className}`}
    >
      <div className="flex min-w-0 gap-3">
        <Lightbulb className="mt-0.5 shrink-0 text-accent" size={20} weight="fill" />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">{t("newbie.tipTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t(TIP_KEYS[page])}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {page !== "guide" ? (
              <Link className="inline-flex items-center gap-1 text-sm font-medium text-accent" to="/guide">
                {t("faq.openGuide")}
                <ArrowRight size={14} weight="bold" />
              </Link>
            ) : null}
            {next ? (
              <Link className="inline-flex items-center gap-1 text-sm font-medium text-accent" to={next.to}>
                {t(next.label)}
                <ArrowRight size={14} weight="bold" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <Button
        className="shrink-0 self-start"
        size="sm"
        variant="ghost"
        onPress={markExperienced}
      >
        <X size={14} weight="bold" />
        {t("newbie.dismissTips")}
      </Button>
    </aside>
  );
}
