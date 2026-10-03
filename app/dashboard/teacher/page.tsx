import { CalendarClock, CheckCheck, FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNairobiDateRange, isScheduledStartInFuture } from '@/lib/utils';
import { SummaryCard } from '@/components/dashboard/summary-card';

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') redirect('/login');

  const userId = (session.user as any).id;
  const { start: startOfToday, end: startOfTomorrow } = getNairobiDateRange();

  const [pendingOccurrences, approved, terminationRequested, approvedTerminations, todayClasses] = await Promise.all([
    prisma.laboratoryRequest.findMany({
      where: {
        teacherId: userId,
        status: 'PENDING',
      },
      select: { reservationDate: true, startTime: true },
    }),
    prisma.laboratoryRequest.count({ where: { teacherId: userId, status: 'APPROVED' } }),
    prisma.laboratoryRequest.count({ where: { teacherId: userId, status: 'TERMINATION_REQUESTED' } }),
    prisma.laboratoryRequest.count({ where: { teacherId: userId, status: 'CANCELLED' } }),
    prisma.laboratoryRequest.count({
      where: {
        teacherId: userId,
        status: 'APPROVED',
        reservationDate: { gte: startOfToday, lt: startOfTomorrow },
      },
    }),
  ]);

  const pending = pendingOccurrences.filter((request) =>
    isScheduledStartInFuture(request.reservationDate, request.startTime),
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Pending Requests" value={pending} icon={<FileText className="h-5 w-5" />} tone="amber" />
        <SummaryCard title="Approved Reservations" value={approved} icon={<CheckCheck className="h-5 w-5" />} tone="teal" />
        <SummaryCard title="Termination Requests" value={terminationRequested} icon={<FileText className="h-5 w-5" />} tone="rose" />
        <SummaryCard title="Approved Terminations" value={approvedTerminations} icon={<CheckCheck className="h-5 w-5" />} tone="violet" />
        <SummaryCard title="Today's Classes" value={todayClasses} icon={<CalendarClock className="h-5 w-5" />} tone="cyan" />
      </div>

      <div className="rounded-lg border border-l-4 border-slate-200 border-l-blue-500 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
          <Link href="/requests/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">
            <PlusCircle className="h-4 w-4" />
            Request Laboratory
          </Link>
        </div>
        <p className="text-sm text-slate-600">Submit a laboratory request and track its approval from your dashboard.</p>
      </div>
    </div>
  );
}
