import {Link} from '@/i18n/navigation';

export default function FeatureCard({
  href,
  index,
  tag,
  title,
  desc,
  linkLabel,
  delayMs = 0,
}: {
  href: string;
  index: number;
  tag: string;
  title: string;
  desc: string;
  linkLabel: string;
  delayMs?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex animate-fade-up cursor-pointer flex-col gap-2.5 rounded-[20px] border border-[#2a2a2a] bg-[#141414] p-7 text-inherit no-underline transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[#3d3d3d] hover:bg-[#1a1a1a] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-md:p-6"
      style={{animationDelay: `${delayMs}ms`}}
    >
      <span className="pointer-events-none absolute right-6 top-5 select-none text-4xl font-black tracking-tighter text-[#2a2a2a] transition-colors duration-500 group-hover:text-[#e8a850]/30">
        {String(index).padStart(2, '0')}
      </span>

      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#e8a850]">
        {tag}
      </span>
      <h3 className="text-xl font-bold tracking-[-0.01em]">{title}</h3>
      <p className="text-[0.9375rem] leading-relaxed text-[#a0a0a0]">{desc}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-[#a0a0a0] transition-all duration-300 group-hover:gap-3 group-hover:text-[#e8a850]">
        {linkLabel}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
