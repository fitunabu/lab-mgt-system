import type { ReactNode } from 'react';

type SummaryCardTone = 'blue' | 'teal' | 'amber' | 'rose' | 'cyan' | 'violet';

const toneStyles: Record<SummaryCardTone, { accent: string; icon: string }> = {
  blue: { accent: 'border-l-blue-500', icon: 'border-blue-100 bg-blue-50 text-blue-700' },
  teal: { accent: 'border-l-teal-500', icon: 'border-teal-100 bg-teal-50 text-teal-700' },
  amber: { accent: 'border-l-amber-500', icon: 'border-amber-100 bg-amber-50 text-amber-700' },
  rose: { accent: 'border-l-rose-500', icon: 'border-rose-100 bg-rose-50 text-rose-700' },
  cyan: { accent: 'border-l-cyan-500', icon: 'border-cyan-100 bg-cyan-50 text-cyan-700' },
  violet: { accent: 'border-l-violet-500', icon: 'border-violet-100 bg-violet-50 text-violet-700' },
};

export function SummaryCard({
  title,
  value,
  detail,
  icon,
  tone = 'blue',
}: {
  title: string;
  value: string | number;
  detail?: string;
  icon: ReactNode;
  tone?: SummaryCardTone;
}) {
  const styles = toneStyles[tone];

  return (
    <div className={`group rounded-lg border border-l-4 border-slate-200 ${styles.accent} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex min-h-16 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${styles.icon}`}>
          {icon}
        </div>
      </div>
      {detail && <p className="mt-3 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
