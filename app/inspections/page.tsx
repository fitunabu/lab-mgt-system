import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default async function InspectionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const inspections = await prisma.equipmentInspection.findMany({ include: { equipment: true, session: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inspections</h1>
      {inspections.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-12 w-12" strokeWidth={1.7} />}
          title="No inspections recorded"
          description="Inspection records will appear here once available."
          tone="amber"
        />
      ) : (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {inspections.map((inspection: (typeof inspections)[number]) => (
          <div key={inspection.id} className="mb-4 border-b border-slate-200 pb-4">
            <p className="font-medium text-slate-800">{inspection.equipment.name}</p>
            <p className="text-sm text-slate-600">Before: {inspection.statusBefore ?? 'N/A'} / After: {inspection.statusAfter ?? 'N/A'}</p>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
