import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EquipmentModal } from '@/components/equipment-modal';
import { EquipmentTypeInventory } from '@/components/equipment-type-inventory';

export default async function EquipmentPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const isTechnicalAssistant = session.user.role === 'TECHNICAL_ASSISTANT';

  const assignedLaboratory = isTechnicalAssistant
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { assignedLaboratoryId: true },
      })
    : null;

  const assignedLabId = assignedLaboratory?.assignedLaboratoryId ?? null;

  const equipment = await prisma.equipment.findMany({
    where: isTechnicalAssistant && assignedLabId ? { laboratoryId: assignedLabId } : undefined,
    include: { laboratory: true },
    orderBy: { createdAt: 'desc' },
  });

  const labs = isTechnicalAssistant && assignedLabId
    ? await prisma.laboratory.findMany({
        where: { id: assignedLabId },
        orderBy: { name: 'asc' },
      })
    : await prisma.laboratory.findMany({ orderBy: { name: 'asc' } });

  const canManageEquipment = session.user.role === 'TECHNICAL_ASSISTANT' || session.user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Equipment</h1>
        {canManageEquipment && !isTechnicalAssistant && <EquipmentModal labs={labs} />}
        {canManageEquipment && isTechnicalAssistant && !assignedLabId && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            No assigned laboratory
          </span>
        )}
        {canManageEquipment && isTechnicalAssistant && assignedLabId && <EquipmentModal labs={labs} />}
      </div>

      <EquipmentTypeInventory equipment={equipment} labs={labs} canManageEquipment={canManageEquipment} />
    </div>
  );
}
