import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";

const CHATGPT_HOME = "https://chatgpt.com/";
const CHATGPT_SESSION = "https://chatgpt.com/api/auth/session";

const STEPS: Array<{
  n: number;
  title: MsgKey;
  desc: MsgKey;
  href?: string;
  action?: MsgKey;
}> = [
  {
    n: 1,
    title: "guide.1.title",
    desc: "guide.1.desc",
    href: CHATGPT_HOME,
    action: "guide.1.action",
  },
  {
    n: 2,
    title: "guide.2.title",
    desc: "guide.2.desc",
    href: CHATGPT_SESSION,
    action: "guide.2.action",
  },
  {
    n: 3,
    title: "guide.3.title",
    desc: "guide.3.desc",
  },
  {
    n: 4,
    title: "guide.4.title",
    desc: "guide.4.desc",
  },
];

export function SessionGuide({ showRecharge = true }: { showRecharge?: boolean }) {
  const { t } = useI18n();
  const steps = showRecharge ? STEPS : STEPS.filter((item) => item.n !== 4);

  return (
    <ol className="flex flex-col gap-8">
      {steps.map((item) => (
        <li key={item.n} className="flex gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {item.n}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-base font-semibold tracking-tight">{t(item.title)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted md:text-base">{t(item.desc)}</p>
            {item.href && item.action ? (
              <a
                className="button button--primary mt-3"
                href={item.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t(item.action)}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
