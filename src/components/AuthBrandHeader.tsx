import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

export function AuthBrandHeader({ tagline }: { tagline: string }) {
  return (
    <Link className="mb-10 flex items-center justify-center gap-3 text-foreground" to="/">
      <BrandLogo className="size-14" />
        <span className="flex flex-col text-left">
        <span className="text-3xl font-black leading-none tracking-tight">Viraltok CDK</span>
        <span className="mt-1 text-[10px] font-bold tracking-widest text-[color:var(--accent)] uppercase">
          {tagline}
        </span>
      </span>
    </Link>
  );
}
