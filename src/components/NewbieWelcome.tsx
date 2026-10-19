import { useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, Lightning } from "@phosphor-icons/react";
import { Button } from "@heroui/react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useI18n } from "@/i18n";

const SKIP_PREFIXES = ["/shop/return", "/account/wallet/return", "/login", "/admin"];

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function NewbieWelcome() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { answered, deferred, markNewbie, markExperienced, deferThisSession } = useOnboarding();
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (answered || deferred || shouldSkip(location.pathname)) {
      setOpen(false);
      return;
    }
    const id = window.setTimeout(() => setOpen(true), 350);
    return () => window.clearTimeout(id);
  }, [answered, deferred, location.pathname]);

  function onNewbie() {
    markNewbie();
    setOpen(false);
    navigate("/guide");
  }

  function onExperienced() {
    markExperienced();
    setOpen(false);
  }

  function onDefer() {
    deferThisSession();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDefer();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only bind while open
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[color:var(--surface)] text-foreground shadow-2xl">
        <div className="border-b border-border/70 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("newbie.badge")}
          </p>
          <h2 id={titleId} className="mt-2 text-xl font-semibold tracking-tight">
            {t("newbie.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("newbie.lead")}</p>
        </div>

        <div className="grid gap-3 px-5 py-5">
          <button
            className="flex w-full items-start gap-3 rounded-2xl border border-border/80 bg-accent/10 p-4 text-left transition hover:border-accent/40"
            type="button"
            onClick={onNewbie}
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <BookOpenText size={18} weight="bold" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">{t("newbie.yes")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{t("newbie.yesDesc")}</span>
            </span>
          </button>

          <button
            className="flex w-full items-start gap-3 rounded-2xl border border-border/80 p-4 text-left transition hover:bg-foreground/5"
            type="button"
            onClick={onExperienced}
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
              <Lightning size={18} weight="bold" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">{t("newbie.no")}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{t("newbie.noDesc")}</span>
            </span>
          </button>
        </div>

        <div className="border-t border-border/70 px-5 py-3">
          <Button className="w-full" size="lg" variant="ghost" onPress={onDefer}>
            {t("newbie.skip")}
          </Button>
        </div>
      </div>
    </div>
  );
}
