import { ClipboardCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { ComputerInspectionForm } from '@/components/computer-inspection-form';
import { InspectionHistory, type InspectionHistoryGroup } from '@/components/inspection-history';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function InspectionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const isTechnicalAssistant = session.user.role === 'TECHNICAL_ASSISTANT';
  const isAdmin = session.user.role === 'ADMIN';
  const assignedUser = isTechnicalAssistant
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { assignedLaboratories: { select: { id: true, name: true } } },
      })
    : null;
  const assignedLaboratories = assignedUser?.assignedLaboratories ?? [];
  const assignedLabIds = assignedLaboratories.map((laboratory) => laboratory.id);

  const [computers, inspections] = await Promise.all([
    isTechnicalAssistant && assignedLabIds.length > 0
      ? prisma.equipment.findMany({
          where: { equipmentType: 'COMPUTER', laboratoryId: { in: assignedLabIds } },
          select: { id: true, name: true, assetNumber: true, laboratoryId: true, laboratory: { select: { name: true } } },
          orderBy: [{ name: 'asc' }, { assetNumber: 'asc' }],
        })
      : Promise.resolve([]),
    prisma.equipmentInspection.findMany({
      where:
        isTechnicalAssistant
          ? { equipment: { laboratoryId: { in: assignedLabIds } } }
          : undefined,
      include: {
        equipment: { select: { name: true, assetNumber: true, laboratory: { select: { id: true, name: true } } } },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const inspectionGroups = new Map<string, InspectionHistoryGroup>();
  for (const inspection of inspections) {
    const inspectedAt = inspection.inspectedAt ?? inspection.createdAt;
    const groupId =
      inspection.batchId ??
      (inspection.sessionId
        ? `session:${inspection.sessionId}`
        : `legacy:${inspection.equipment.laboratory.id}:${inspection.inspectedBy ?? 'unknown'}:${inspectedAt.toISOString()}`);
    let group = inspectionGroups.get(groupId);
    if (!group) {
      group = {
        id: groupId,
        laboratoryId: inspection.equipment.laboratory.id,
        laboratoryName: inspection.equipment.laboratory.name,
        inspectorName: inspection.inspector?.name ?? 'Unknown',
        inspectedAt: inspectedAt.toISOString(),
        inspections: [],
      };
      inspectionGroups.set(groupId, group);
    }
    group.inspections.push({
      id: inspection.id,
      computerName: inspection.equipment.name,
      assetNumber: inspection.equipment.assetNumber,
      statusAfter: inspection.statusAfter,
      notes: inspection.notes,
      internetConnected: inspection.internetConnected,
      monitorFunctional: inspection.monitorFunctional,
      mouseFunctional: inspection.mouseFunctional,
      powerCableFunctional: inspection.powerCableFunctional,
      wallOutletFunctional: inspection.wallOutletFunctional,
      osFunctional: inspection.osFunctional,
    });
  }
  const sortedHistoryGroups = Array.from(inspectionGroups.values()).sort(
    (left, right) => new Date(right.inspectedAt).getTime() - new Date(left.inspectedAt).getTime(),
  );
  const historyGroups = isAdmin
    ? Array.from(
        sortedHistoryGroups.reduce((latestByLaboratory, group) => {
          if (!latestByLaboratory.has(group.laboratoryId)) {
            latestByLaboratory.set(group.laboratoryId, group);
          }
          return latestByLaboratory;
        }, new Map<string, InspectionHistoryGroup>()).values(),
      )
    : sortedHistoryGroups;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inspections</h1>

      {isTechnicalAssistant && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Laboratory computer inspection</h2>
          <p className="mb-5 text-sm text-slate-600">
            Saved records cannot be edited; you can create another inspection at any time.
          </p>
          {assignedLabIds.length === 0 ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              You need an assigned laboratory before you can inspect computers.
            </p>
          ) : computers.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              No registered computers were found.
            </p>
          ) : (
            <ComputerInspectionForm computers={computers} laboratories={assignedLaboratories} />
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Inspection history</h2>
        {inspections.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="h-12 w-12" strokeWidth={1.7} />}
            title="No inspections recorded"
            description="Computer inspection records will appear here once submitted."
            tone="amber"
          />
        ) : (
          <InspectionHistory groups={historyGroups} />
        )}
      </section>
    </div>
  );
}
