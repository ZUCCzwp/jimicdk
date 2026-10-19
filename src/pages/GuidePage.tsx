import type { ReactNode } from "react";
import { ArrowRight, CheckCircle, ShieldWarning, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button, Surface } from "@heroui/react";
import { NewbieTip } from "@/components/NewbieTip";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";

const CHATGPT_HOME = "https://chatgpt.com/";
const CHATGPT_SESSION = "https://chatgpt.com/api/auth/session";

const PREREQ = ["guide.prereq.1", "guide.prereq.2", "guide.prereq.3", "guide.prereq.4"] as const;
const B1 = ["guide.b1.1", "guide.b1.2", "guide.b1.3"] as const;
const B2 = ["guide.b2.1", "guide.b2.2", "guide.b2.3", "guide.b2.4"] as const;
const B3 = ["guide.b3.1", "guide.b3.2", "guide.b3.3"] as const;
const S1 = ["guide.s1.1", "guide.s1.2", "guide.s1.3", "guide.s1.4"] as const;
const S2A = ["guide.s2a.1", "guide.s2a.2"] as const;
const S2B = ["guide.s2b.1", "guide.s2b.2", "guide.s2b.3"] as const;
const S2C = ["guide.s2c.1", "guide.s2c.2", "guide.s2c.3", "guide.s2c.4"] as const;
const S3 = ["guide.s3.1", "guide.s3.2", "guide.s3.3"] as const;
const S4 = ["guide.s4.1", "guide.s4.2", "guide.s4.3"] as const;
const CANCEL = ["guide.cancel.1", "guide.cancel.2", "guide.cancel.3"] as const;
const FAIL = ["guide.fail.1", "guide.fail.2", "guide.fail.3"] as const;
const SECURITY = ["guide.security.1", "guide.security.2", "guide.security.3"] as const;
const CHECKLIST = [
  "guide.check.1",
  "guide.check.2",
  "guide.check.3",
  "guide.check.4",
  "guide.check.5",
  "guide.check.6",
  "guide.check.7",
] as const;
const ERRORS = [
  { title: "guide.err.1.t", body: "guide.err.1.b" },
  { title: "guide.err.2.t", body: "guide.err.2.b" },
  { title: "guide.err.3.t", body: "guide.err.3.b" },
] as const;
const STATUSES = [
  { title: "guide.status.1.t", body: "guide.status.1.b" },
  { title: "guide.status.2.t", body: "guide.status.2.b" },
  { title: "guide.status.3.t", body: "guide.status.3.b" },
  { title: "guide.status.4.t", body: "guide.status.4.b" },
  { title: "guide.status.5.t", body: "guide.status.5.b" },
] as const;
const FLOW = [
  "guidePage.flow.shop",
  "guidePage.flow.pay",
  "guidePage.flow.redeem",
  "guidePage.flow.progress",
] as const;

function StepList({ keys }: { keys: readonly MsgKey[] }) {
  const { t } = useI18n();
  return (
    <ol className="mt-4 space-y-2.5">
      {keys.map((key, i) => (
        <li key={key} className="flex gap-3 text-base leading-relaxed text-muted">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {i + 1}
          </span>
          <span>{t(key)}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ keys }: { keys: readonly MsgKey[] }) {
  const { t } = useI18n();
  return (
    <ul className="mt-4 space-y-2.5">
      {keys.map((key) => (
        <li key={key} className="flex gap-3 text-base leading-relaxed text-muted">
          <CheckCircle className="mt-0.5 shrink-0 text-accent" size={18} weight="fill" />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}

function PartHeading({ label }: { label: string }) {
  return (
    <h2 className="pt-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">{label}</h2>
  );
}

function Section({
  n,
  title,
  lead,
  children,
}: {
  n?: number;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <Surface className="rounded-3xl p-6 md:p-9">
      <div className="flex items-start gap-4">
        {n != null ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {n}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {lead ? <p className="mt-2 text-base leading-relaxed text-muted">{lead}</p> : null}
          {children}
        </div>
      </div>
    </Surface>
  );
}

export function GuidePage() {
  const { t } = useI18n();

  return (
    <section>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="max-w-[20ch] text-4xl font-semibold tracking-tight md:text-5xl">
            {t("guidePage.title")}
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted md:text-lg">
            {t("guidePage.lead")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/shop">
              {t("guidePage.goShop")}
              <ArrowRight size={16} weight="bold" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/redeem">{t("guidePage.goRedeem")}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        {FLOW.map((key, i) => (
          <span
            key={key}
            className="rounded-full border border-border/80 bg-surface px-3.5 py-1.5 font-medium tracking-tight"
          >
            {`${["①", "②", "③", "④"][i]} ${t(key)}`}
          </span>
        ))}
      </div>

      <NewbieTip className="mt-8" page="guide" />

      <div className="mt-10 space-y-6">
        <Section title={t("guidePage.prereqTitle")} lead={t("guidePage.prereqLead")}>
          <BulletList keys={PREREQ} />
        </Section>

        <PartHeading label={t("guidePage.partBuy")} />

        <Section n={1} title={t("guidePage.b1Title")} lead={t("guidePage.b1Lead")}>
          <StepList keys={B1} />
          <Button asChild className="mt-4" size="lg" variant="secondary">
            <Link to="/shop">
              {t("guidePage.goShop")}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </Button>
        </Section>

        <Section n={2} title={t("guidePage.b2Title")} lead={t("guidePage.b2Lead")}>
          <StepList keys={B2} />
          <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm leading-relaxed text-muted">
            {t("guidePage.b2Tip")}
          </p>
        </Section>

        <Section n={3} title={t("guidePage.b3Title")} lead={t("guidePage.b3Lead")}>
          <StepList keys={B3} />
          <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm leading-relaxed text-muted">
            {t("guidePage.b3Tip")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/redeem">
                {t("guidePage.goRedeem")}
                <ArrowRight size={14} weight="bold" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/lookup">{t("nav.lookup")}</Link>
            </Button>
          </div>
        </Section>

        <PartHeading label={t("guidePage.partRedeem")} />

        <Section n={4} title={t("guidePage.s1Title")} lead={t("guidePage.s1Lead")}>
          <StepList keys={S1} />
          <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm leading-relaxed text-muted">
            {t("guidePage.s1Tip")}
          </p>
        </Section>

        <Section n={5} title={t("guidePage.s2Title")} lead={t("guidePage.s2Lead")}>
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{t("guidePage.s2aTitle")}</h3>
              <StepList keys={S2A} />
              <a
                className="button button--primary mt-4"
                href={CHATGPT_HOME}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("guide.1.action")}
                <ArrowRight size={14} weight="bold" />
              </a>
            </div>

            <div>
              <h3 className="text-lg font-semibold tracking-tight">{t("guidePage.s2bTitle")}</h3>
              <StepList keys={S2B} />
              <a
                className="button button--primary mt-4"
                href={CHATGPT_SESSION}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("guide.2.action")}
                <ArrowRight size={14} weight="bold" />
              </a>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("guidePage.s2bNeed")}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold tracking-tight">{t("guidePage.s2cTitle")}</h3>
              <StepList keys={S2C} />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold tracking-tight">{t("guidePage.errTitle")}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {ERRORS.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/80 p-4">
                    <p className="flex items-start gap-2 text-sm font-medium">
                      <WarningCircle className="mt-0.5 shrink-0 text-amber-500" size={16} weight="fill" />
                      {t(item.title)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{t(item.body)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section n={6} title={t("guidePage.s3Title")} lead={t("guidePage.s3Lead")}>
          <StepList keys={S3} />
          <p className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm leading-relaxed text-muted">
            {t("guidePage.s3Tip")}
          </p>
        </Section>

        <Section n={7} title={t("guidePage.s4Title")} lead={t("guidePage.s4Lead")}>
          <StepList keys={S4} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STATUSES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/80 p-4">
                <p className="text-sm font-semibold tracking-tight">{t(item.title)}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(item.body)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("guidePage.cancelTitle")} lead={t("guidePage.cancelLead")}>
          <StepList keys={CANCEL} />
        </Section>

        <Section title={t("guidePage.failTitle")} lead={t("guidePage.failLead")}>
          <BulletList keys={FAIL} />
        </Section>

        <Section title={t("guidePage.securityTitle")}>
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <ShieldWarning className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={22} weight="fill" />
            <div>
              <p className="text-sm font-medium">{t("security.body")}</p>
              <ul className="mt-3 space-y-2">
                {SECURITY.map((key) => (
                  <li key={key} className="text-sm leading-relaxed text-muted">
                    · {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section title={t("guidePage.checkTitle")} lead={t("guidePage.checkLead")}>
          <BulletList keys={CHECKLIST} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/shop">
                {t("guidePage.goShop")}
                <ArrowRight size={16} weight="bold" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/redeem">{t("guidePage.goRedeem")}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/faq">{t("faq.more")}</Link>
            </Button>
          </div>
        </Section>
      </div>
    </section>
  );
}
