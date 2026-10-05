import { Building2, Boxes, ClipboardCheck, ShieldCheck, Users, Wrench } from 'lucide-react';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { AssistantLaboratoryAssignment } from '@/components/assistant-laboratory-assignment';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isScheduledStartInFuture } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/login');

  const [labs, users, equipment, pendingOccurrences, assistants] = await Promise.all([
    prisma.laboratory.count(),
    prisma.user.count(),
    prisma.equipment.count(),
    prisma.laboratoryRequest.findMany({
      where: { status: 'PENDING' },
      select: { reservationDate: true, startTime: true },
    }),
    prisma.user.findMany({
      where: { role: 'TECHNICAL_ASSISTANT' },
      orderBy: { name: 'asc' },
      include: { assignedLaboratories: { select: { id: true, name: true, code: true } } },
    }),
  ]);

  const requests = pendingOccurrences.filter((request) =>
    isScheduledStartInFuture(request.reservationDate, request.startTime),
  ).length;

  const availableLabs = await prisma.laboratory.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Laboratories" value={labs} icon={<Building2 className="h-5 w-5" />} tone="blue" />
        <SummaryCard title="Users" value={users} icon={<Users className="h-5 w-5" />} tone="teal" />
        <SummaryCard title="Total Equipment" value={equipment} icon={<Boxes className="h-5 w-5" />} tone="amber" />
        <SummaryCard title="Pending Requests" value={requests} icon={<ClipboardCheck className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700"><Building2 className="h-5 w-5" /></span>
            <h3 className="text-lg font-semibold text-slate-900">System Overview</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Available Laboratories</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.laboratory.count({ where: { status: 'AVAILABLE' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Reserved Laboratories</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.laboratory.count({ where: { status: 'RESERVED' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Occupied Laboratories</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.laboratory.count({ where: { status: 'OCCUPIED' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Under Inspection</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.laboratory.count({ where: { status: 'INSPECTION' } })}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-700"><Wrench className="h-5 w-5" /></span>
            <h3 className="text-lg font-semibold text-slate-900">Equipment Conditions</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Functional</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.equipment.count({ where: { status: 'FUNCTIONAL' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Non-Functional</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.equipment.count({ where: { status: 'NON_FUNCTIONAL' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Damaged</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.equipment.count({ where: { status: 'DAMAGED' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Missing</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.equipment.count({ where: { status: 'MISSING' } })}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Maintenance</span>
              <span className="min-w-9 rounded-full bg-white px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-slate-900">{await prisma.equipment.count({ where: { status: 'UNDER_MAINTENANCE' } })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Assign Laboratories to Technical Assistants</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{assistants.length} assistants</span>
        </div>

        <div className="space-y-4">
          {assistants.map((assistant) => (
            <AssistantLaboratoryAssignment
              key={assistant.id}
              assistant={assistant}
              laboratories={availableLabs}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
