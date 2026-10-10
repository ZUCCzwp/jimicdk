import { useEffect, useId, useMemo } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@heroui/react";
import { useI18n } from "@/i18n";

export type SiteNoticePayload = {
  enabled: boolean;
  content: string;
};

type Props = {
  announcement: SiteNoticePayload | null;
  notifications: SiteNoticePayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Auto-open once per session when content is new. */
  autoPrompt?: boolean;
};

const DISMISS_KEY = "jimicdk.siteNoticesDismissed";

type NoticeItem = {
  key: string;
  kind: "announce" | "notice";
  label: string;
  content: string;
};

function fingerprint(items: NoticeItem[]): string {
  return items.map((item) => `${item.key}:${item.content}`).join("|");
}

export function buildNoticeItems(
  announcement: SiteNoticePayload | null,
  notifications: SiteNoticePayload | null,
  labels: { announce: string; notice: string },
): NoticeItem[] {
  const next: NoticeItem[] = [];
  if (announcement?.enabled && announcement.content.trim()) {
    next.push({
      key: "announce",
      kind: "announce",
      label: labels.announce,
      content: announcement.content.trim(),
    });
  }
  if (notifications?.enabled && notifications.content.trim()) {
    next.push({
      key: "notice",
      kind: "notice",
      label: labels.notice,
      content: notifications.content.trim(),
    });
  }
  return next;
}

export function hasSiteNotices(
  announcement: SiteNoticePayload | null,
  notifications: SiteNoticePayload | null,
): boolean {
  return Boolean(
    (announcement?.enabled && announcement.content.trim()) ||
      (notifications?.enabled && notifications.content.trim()),
  );
}

export function SiteNotices({
  announcement,
  notifications,
  open,
  onOpenChange,
  autoPrompt = true,
}: Props) {
  const { t } = useI18n();
  const titleId = useId();
  const items = useMemo(
    () =>
      buildNoticeItems(announcement, notifications, {
        announce: t("announce"),
        notice: t("notifications.title"),
      }),
    [announcement, notifications, t],
  );
  const fp = useMemo(() => fingerprint(items), [items]);

  useEffect(() => {
    if (!autoPrompt || items.length === 0) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === fp) return;
    } catch {
      /* ignore */
    }
    onOpenChange(true);
  }, [autoPrompt, fp, items.length, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, fp]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, fp);
    } catch {
      /* ignore */
    }
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="site-notice-modal w-full max-w-md overflow-hidden rounded-2xl bg-[color:var(--surface)] text-foreground shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {t("siteNotices.title")}
          </h2>
          <button
            aria-label={t("siteNotices.close")}
            className="rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground"
            type="button"
            onClick={dismiss}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted">{t("siteNotices.empty")}</p>
          ) : (
            items.map((item) => (
              <div
                key={item.key}
                className={`site-notice-modal__item ${
                  item.kind === "announce" ? "site-notice-modal__item--announce" : "site-notice-modal__item--notice"
                }`}
              >
                <span className="site-notice-modal__badge">{item.label}</span>
                <p className="site-notice-modal__text">{item.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border/70 px-4 py-3">
          <Button className="w-full" size="lg" onPress={dismiss}>
            {t("siteNotices.ack")}
          </Button>
        </div>
      </div>
    </div>
  );
}
