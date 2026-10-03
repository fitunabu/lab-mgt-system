import { ClipboardList, Gauge, ShieldAlert, Wrench } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isScheduledStartInFuture } from '@/lib/utils';
import { SummaryCard } from '@/components/dashboard/summary-card';

export default async function AssistantDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TECHNICAL_ASSISTANT') redirect('/login');

  const assignedLaboratory = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { assignedLaboratoryId: true },
  });

  const assignedLabId = assignedLaboratory?.assignedLaboratoryId ?? null;

  const [pendingOccurrences, occupied, inspection, reports] = await Promise.all([
    prisma.laboratoryRequest.findMany({
      where: assignedLabId
        ? { laboratoryId: assignedLabId, status: 'PENDING' }
        : { id: 'no-assigned-lab', status: 'PENDING' },
      select: { reservationDate: true, startTime: true },
    }),
    prisma.laboratory.count({
      where: assignedLabId ? { id: assignedLabId, status: 'OCCUPIED' } : { id: 'no-assigned-lab', status: 'OCCUPIED' },
    }),
    prisma.laboratory.count({
      where: assignedLabId ? { id: assignedLabId, status: 'INSPECTION' } : { id: 'no-assigned-lab', status: 'INSPECTION' },
    }),
    prisma.equipmentReport.count({
      where: assignedLabId
        ? {
            equipment: { laboratoryId: assignedLabId },
            status: { not: 'RESOLVED' },
          }
        : { id: 'no-assigned-lab', status: { not: 'RESOLVED' } },
    }),
  ]);

  const pending = pendingOccurrences.filter((request) =>
    isScheduledStartInFuture(request.reservationDate, request.startTime),
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Pending Requests" value={pending} icon={<ClipboardList className="h-5 w-5" />} tone="amber" />
        <SummaryCard title="Currently Occupied Labs" value={occupied} icon={<Gauge className="h-5 w-5" />} tone="blue" />
        <SummaryCard title="Labs Awaiting Inspection" value={inspection} icon={<ShieldAlert className="h-5 w-5" />} tone="violet" />
        <SummaryCard title="Open Equipment Reports" value={reports} icon={<Wrench className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Quick actions</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Action label="Review Requests" href="/requests" icon={<ClipboardList className="h-5 w-5" />} />
          <Action label="Register Equipment" href="/equipment" icon={<Wrench className="h-5 w-5" />} />
          <Action label="Inspect Laboratory" href="/inspections" icon={<ShieldAlert className="h-5 w-5" />} />
          <Action label="View Schedule" href="/schedule" icon={<Gauge className="h-5 w-5" />} />
        </div>
      </div>
    </div>
  );
}

function Action({ label, href, icon }: { label: string; href: string; icon: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-700">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
