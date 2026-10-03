import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestForm } from '@/components/forms/request-form';

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') redirect('/login');

  const laboratories = await prisma.laboratory.findMany({
    where: { status: { not: 'INACTIVE' } },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Request Laboratory</h1>
        <p className="text-sm text-slate-600">Select a date, time, and laboratory for your teaching session.</p>
      </div>
      <RequestForm laboratories={laboratories} />
    </div>
  );
}
