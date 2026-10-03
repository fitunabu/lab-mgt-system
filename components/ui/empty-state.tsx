import type { ReactNode } from 'react';
import Image from 'next/image';
import lmsLogo from '../../app/LMS-01.png';

type EmptyStateTone = 'blue' | 'teal' | 'amber';

const toneStyles: Record<EmptyStateTone, string> = {
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
  teal: 'border-teal-100 bg-teal-50 text-teal-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
};

export function EmptyState({
  icon,
  title,
  description,
  tone = 'blue',
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: EmptyStateTone;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state-panel flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-12">
        <div className="text-center md:text-left">
          <div className={`mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border md:mx-0 ${toneStyles[tone]}`}>
            {icon}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600">{description}</p>
          {action && <div className="mt-6 flex justify-center md:justify-start">{action}</div>}
        </div>
        <div className="flex justify-center">
          <Image
            src={lmsLogo}
            alt="Laboratory Management System"
            width={256}
            height={256}
            className="h-48 w-48 object-contain sm:h-56 sm:w-56"
          />
        </div>
      </div>
    </section>
  );
}