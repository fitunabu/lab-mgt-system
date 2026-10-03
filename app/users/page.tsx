import { redirect } from 'next/navigation';
import { TechnicalAssistantManager } from '@/components/technical-assistant-manager';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login');

  const [assistants, laboratories] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'TECHNICAL_ASSISTANT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        assignedLaboratoryId: true,
        assignedLaboratory: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.laboratory.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-5">
      <TechnicalAssistantManager assistants={assistants} laboratories={laboratories} />
    </div>
  );
}