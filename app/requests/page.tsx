import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { RequestActions } from '@/components/request-actions';
import { EmptyState } from '@/components/ui/empty-state';
import { Archive, ClipboardList, Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { isScheduledEndInPast } from '@/lib/utils';

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { view } = await searchParams;
  const showOldRequests = view === 'old';

  const isTechnicalAssistant = session.user.role === 'TECHNICAL_ASSISTANT';
  const isTeacher = session.user.role === 'TEACHER';
  const currentUserRole = session.user.role;

  const assignedLaboratory = isTechnicalAssistant
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { assignedLaboratories: { select: { id: true } } },
      })
    : null;
  const assignedLaboratoryIds = assignedLaboratory?.assignedLaboratories.map((laboratory) => laboratory.id) ?? [];

  const [requests, laboratories] = await Promise.all([
    prisma.laboratoryRequest.findMany({
      where: isTeacher
        ? { teacherId: session.user.id }
        : isTechnicalAssistant
          ? { laboratoryId: { in: assignedLaboratoryIds } }
          : undefined,
      include: { laboratory: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.laboratory.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const activeRequests = requests.filter((request) => !isScheduledEndInPast(request.reservationDate, request.endTime));
  const oldRequests = requests.filter((request) => isScheduledEndInPast(request.reservationDate, request.endTime));
  const displayedRequests = showOldRequests ? oldRequests : activeRequests;

  const formatRecurrence = (value?: string | null) => {
    if (!value) return 'Single day';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {showOldRequests ? 'Old Laboratory Requests' : 'Laboratory Requests'}
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href={showOldRequests ? '/requests' : '/requests?view=old'}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {showOldRequests ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {showOldRequests ? 'Show active requests' : `Show old requests (${oldRequests.length})`}
          </Link>
        </div>
      </div>

      {displayedRequests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" strokeWidth={1.7} />}
          title={showOldRequests ? 'No old requests' : 'No active requests'}
          description={isTechnicalAssistant
            ? showOldRequests ? 'There are no past requests for this laboratory.' : 'There are no upcoming requests to review for this laboratory.'
            : showOldRequests ? 'Past laboratory requests will appear here.' : 'There are no upcoming laboratory requests to display.'}
          tone="blue"
          action={isTeacher && !showOldRequests ? (
            <Link href="/requests/new" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          ) : undefined}
        />
      ) : (
      <div className="app-table-shell">
        <table className="app-data-table app-data-table--requests">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Teacher</th>
              <th className="px-4 py-3 font-medium text-slate-600">Laboratory</th>
              <th className="px-4 py-3 font-medium text-slate-600">Date & Time</th>
              <th className="px-4 py-3 font-medium text-slate-600">Course</th>
              <th className="px-4 py-3 font-medium text-slate-600">Students</th>
              <th className="px-4 py-3 font-medium text-slate-600">Purpose</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              {(isTechnicalAssistant || isTeacher) && <th className="px-4 py-3 font-medium text-slate-600">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {displayedRequests.map((request) => (
              <tr key={request.id} className="align-top">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{request.teacher.name}</p>
                    {(request.rejectionReason && (request.status === 'REJECTED' || request.status === 'TERMINATION_REQUESTED')) && (
                      <p className="mt-1 text-xs text-red-600">Reason: {request.rejectionReason}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{request.laboratory.name}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">
                    {new Date(request.reservationDate.getFullYear(), request.reservationDate.getMonth(), request.reservationDate.getDate()).toLocaleDateString()}
                  </span>
                  <br />
                  <span className="text-slate-600">{request.startTime} - {request.endTime}</span>
                  {request.endDate && request.startDate && new Date(request.endDate).getTime() !== new Date(request.startDate).getTime() && (
                    <>
                      <br />
                      <span className="text-xs text-slate-500">Ends: {new Date(request.endDate).toLocaleDateString()}</span>
                    </>
                  )}
                  {request.recurrencePattern && (
                    <>
                      <br />
                      <span className="text-xs text-slate-500">Pattern: {formatRecurrence(request.recurrencePattern)}</span>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">{request.course}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{request.studentCount}</td>
                <td className="max-w-xs px-4 py-3 leading-relaxed">{request.purpose}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    request.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'TERMINATION_REQUESTED'
                        ? 'bg-amber-100 text-amber-800'
                        : request.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : request.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-700'
                  }`}>
                    {request.status}
                  </span>
                </td>
                {(isTechnicalAssistant || isTeacher) && (
                  <td className="px-4 py-3">
                    {(request.status === 'PENDING' || request.status === 'APPROVED' || request.status === 'TERMINATION_REQUESTED') && (isTechnicalAssistant || request.teacherId === session.user.id) ? (
                      <RequestActions
                        request={request}
                        laboratories={laboratories}
                        role={currentUserRole}
                        isOwner={request.teacherId === session.user.id}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Reviewed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
