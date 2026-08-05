import {Link} from '@/i18n/navigation';

export default function FeatureCard({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="mb-2 text-xl font-bold">{title}</div>
      <div className="mb-3.5 text-sm leading-relaxed text-muted">{desc}</div>
      <div className="font-semibold text-accent">{cta}</div>
    </Link>
  );
}
