import { Check } from "@phosphor-icons/react";
import { useI18n } from "@/i18n";

const STEP_IDS = [1, 2, 3] as const;
const STEP_KEYS = ["step.verify", "step.session", "step.confirm"] as const;

export function RedeemStepper({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useI18n();

  return (
    <ol className="grid grid-cols-3 gap-3 rounded-3xl border border-border/80 bg-background px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
      {STEP_IDS.map((id, index) => {
        const done = step > id;
        const current = step === id;
        return (
          <li key={id} className="flex min-w-0 items-center gap-3">
            {index > 0 && (
              <span
                aria-hidden
                className={`hidden h-px flex-1 sm:block ${done || current ? "bg-accent/50" : "bg-border"}`}
              />
            )}
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                current
                  ? "bg-accent text-accent-foreground"
                  : done
                    ? "bg-accent/15 text-accent"
                    : "bg-foreground/8 text-muted"
              }`}
            >
              {done ? <Check size={16} weight="bold" /> : id}
            </span>
            <span
              className={`truncate text-sm sm:text-base ${current ? "font-medium" : "text-muted"}`}
            >
              {t(STEP_KEYS[index])}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
