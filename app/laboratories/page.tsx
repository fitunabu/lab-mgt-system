import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LaboratoryModal } from '@/components/laboratory-modal';
import { LaboratoryActionMenu } from '@/components/laboratory-action-menu';

export default async function LaboratoriesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const labs = await prisma.laboratory.findMany({ orderBy: { name: 'asc' } });
  const isAdmin = session.user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Laboratories</h1>
        {isAdmin && <LaboratoryModal />}
      </div>

      <div className="app-table-shell">
        <table className="app-data-table app-data-table--laboratories">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Status</th>
              {isAdmin && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {labs.map((lab) => (
              <tr key={lab.id} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3 font-semibold text-slate-900">{lab.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{lab.code}</span>
                </td>
                <td className="px-4 py-3">{lab.location}</td>
                <td className="px-4 py-3 font-medium tabular-nums">{lab.capacity}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    lab.status === 'AVAILABLE'
                      ? 'bg-green-100 text-green-800'
                      : lab.status === 'RESERVED'
                        ? 'bg-blue-100 text-blue-800'
                        : lab.status === 'OCCUPIED'
                          ? 'bg-amber-100 text-amber-800'
                          : lab.status === 'INSPECTION'
                            ? 'bg-violet-100 text-violet-800'
                            : lab.status === 'MAINTENANCE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                  }`}>
                    {lab.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <LaboratoryActionMenu laboratory={lab} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
