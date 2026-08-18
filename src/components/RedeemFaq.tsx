import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { Surface } from "@heroui/react";

const ITEMS = [2, 3, 4, 5] as const;

export function RedeemFaq() {
  const { t } = useI18n();

  return (
    <Surface className="rounded-3xl p-6 md:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{t("faq.title")}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{t("faq.lead")}</p>

      <div className="mt-5 divide-y divide-border/80">
        {ITEMS.map((id, index) => (
          <details key={id} className="group py-3.5" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[0.95rem] font-medium tracking-tight">
              <span>{t(`faq.${id}.q` as MsgKey)}</span>
              <CaretDown
                className="mt-0.5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                size={18}
                weight="bold"
              />
            </summary>
            <p className="mt-2 pr-7 text-sm leading-relaxed text-muted">
              {t(`faq.${id}.a` as MsgKey)}
            </p>
          </details>
        ))}
      </div>

      <Link
        className="mt-2 inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-accent"
        to="/faq"
      >
        {t("faq.more")}
        <ArrowRight size={14} weight="bold" />
      </Link>
    </Surface>
  );
}
