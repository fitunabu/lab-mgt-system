import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function ReservationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') redirect('/login');

  const now = new Date();
  const requests = (await prisma.laboratoryRequest.findMany({
    where: {
      teacherId: session.user.id,
      status: 'APPROVED',
    },
    include: { laboratory: true },
    orderBy: { reservationDate: 'asc' },
  })).filter((request) => request.reservationDate > now);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Reservations</h1>

      <div className="app-table-shell">
        <table className="app-data-table">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Laboratory</th>
              <th className="px-4 py-3 font-medium text-slate-600">Date &amp; Time</th>
              <th className="px-4 py-3 font-medium text-slate-600">Course</th>
              <th className="px-4 py-3 font-medium text-slate-600">Students</th>
              <th className="px-4 py-3 font-medium text-slate-600">Purpose</th>
              <th className="px-4 py-3 font-medium text-slate-600">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No current approved reservations.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const reservationDate = new Date(request.reservationDate);
                const dueDate = request.endDate ?? request.reservationDate;

                return (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-3">{request.laboratory.name}</td>
                    <td className="px-4 py-3">
                      {new Date(reservationDate.getFullYear(), reservationDate.getMonth(), reservationDate.getDate()).toLocaleDateString()}
                      <br />
                      {request.startTime} - {request.endTime}
                    </td>
                    <td className="px-4 py-3">{request.course}</td>
                    <td className="px-4 py-3">{request.studentCount}</td>
                    <td className="max-w-xs px-4 py-3">{request.purpose}</td>
                    <td className="px-4 py-3">
                      {new Date(dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}