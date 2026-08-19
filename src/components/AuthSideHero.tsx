import { CheckCircle } from "@phosphor-icons/react";

export function AuthSideHero({
  title,
  subtitle,
  features,
}: {
  title: string;
  subtitle: string;
  features: string[];
}) {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:p-12 bg-[color:var(--accent)] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-white/15 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-black/10 blur-[120px] dark:bg-teal-500/20" />
        <div className="absolute top-1/2 -left-10 -translate-y-1/2 rotate-90 whitespace-nowrap text-[9rem] font-black tracking-tighter text-white/[0.06]">
          VIRALTOK CDK
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-white/90">
          ChatGPT Plus / 5x / 20x
        </p>
        <h2 className="mb-5 text-4xl font-black leading-[1.1] tracking-tight text-white md:text-5xl">
          {title}
        </h2>
        <p className="mb-10 max-w-[36ch] text-lg font-medium leading-relaxed text-white/75">
          {subtitle}
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <CheckCircle className="text-white" size={18} weight="fill" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-white">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
