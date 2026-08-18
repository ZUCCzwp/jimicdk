import { CaretDown } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";
import { Surface } from "@heroui/react";

const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function FaqPage() {
  const { t } = useI18n();

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("faq.title")}</h1>
      <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted md:text-lg">{t("faq.lead")}</p>

      <div className="mt-10 space-y-3">
        {ITEMS.map((id) => (
          <Surface key={id} className="rounded-3xl px-6 py-1 md:px-8">
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-tight">
                <span>{t(`faq.${id}.q` as MsgKey)}</span>
                <CaretDown
                  className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                  size={24}
                  weight="bold"
                />
              </summary>
              <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted">
                {t(`faq.${id}.a` as MsgKey)}
              </p>
            </details>
          </Surface>
        ))}
      </div>
    </section>
  );
}
