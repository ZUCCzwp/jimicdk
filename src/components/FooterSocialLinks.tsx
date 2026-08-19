import type { MouseEvent } from "react";
import { EnvelopeSimple, GithubLogo } from "@phosphor-icons/react";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.791 19.791 0 0 0 15.4 2.8a13.5 13.5 0 0 0-.64 1.305a18.51 18.51 0 0 0-5.52 0A13.5 13.5 0 0 0 8.6 2.8a19.736 19.736 0 0 0-4.92 1.57C.56 8.976-.286 13.468.137 17.896a19.98 19.98 0 0 0 6.03 3.06c.49-.67.93-1.38 1.31-2.12c-.72-.27-1.41-.6-2.06-.99c.17-.13.33-.26.49-.4c3.97 1.86 8.27 1.86 12.19 0c.16.14.32.27.49.4c-.65.39-1.34.72-2.06.99c.38.74.82 1.45 1.31 2.12a19.86 19.86 0 0 0 6.03-3.06c.5-5.133-.86-9.584-3.12-13.527zM8.02 15.2c-1.18 0-2.15-1.08-2.15-2.4c0-1.32.95-2.4 2.15-2.4c1.2 0 2.16 1.09 2.15 2.4c0 1.32-.95 2.4-2.15 2.4zm7.96 0c-1.18 0-2.15-1.08-2.15-2.4c0-1.32.95-2.4 2.15-2.4c1.2 0 2.16 1.09 2.15 2.4c0 1.32-.95 2.4-2.15 2.4z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function FooterSocialLinks() {
  // 这里先把 href 置为占位；你给我真实链接后我再替换成可点击跳转。
  function placeholder(e: MouseEvent) {
    e.preventDefault();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      <a className="footer-social-link" href="#" onClick={placeholder} aria-label="Discord" title="Discord">
        <DiscordIcon className="footer-social-link__icon" />
      </a>
      <a className="footer-social-link" href="#" onClick={placeholder} aria-label="Telegram" title="Telegram">
        <TelegramIcon className="footer-social-link__icon" />
      </a>
      <a className="footer-social-link" href="#" onClick={placeholder} aria-label="X" title="X">
        <XIcon className="footer-social-link__icon" />
      </a>
      <a className="footer-social-link" href="#" onClick={placeholder} aria-label="Email" title="Email">
        <EnvelopeSimple className="footer-social-link__icon" weight="bold" />
      </a>
      <a className="footer-social-link" href="#" onClick={placeholder} aria-label="Github" title="Github">
        <GithubLogo className="footer-social-link__icon" weight="bold" />
      </a>
    </div>
  );
}

