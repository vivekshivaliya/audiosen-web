import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = {
  href?: string;
  className?: string;
};

export function BrandLockup({ href = "/", className = "" }: BrandLockupProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-3 text-slate-900 ${className}`.trim()}>
      <span className="relative inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_18px_-14px_rgba(8,68,119,0.7)]">
        <Image
          src="/audiosen-company-logo.png"
          alt="Audiosen logo mark"
          fill
          sizes="44px"
          className="object-cover object-center scale-[2.2] translate-y-[-16%]"
          priority
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[2rem] font-semibold tracking-tight">Audiosen</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Hearing Care Clinic
        </span>
      </span>
    </Link>
  );
}
