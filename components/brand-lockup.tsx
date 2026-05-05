import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = {
  href?: string;
  className?: string;
};

export function BrandLockup({ href = "/", className = "" }: BrandLockupProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-3 text-slate-900 ${className}`.trim()}>
      <span className="relative inline-flex h-12 w-12 shrink-0">
        <Image
          src="/audiosen-logo-mark.png"
          alt="Audiosen logo mark"
          fill
          sizes="48px"
          className="object-contain object-center"
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
