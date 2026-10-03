import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ScheduleCalendar } from '@/components/schedule-calendar';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const requests = (await prisma.laboratoryRequest.findMany({
    where: { status: 'APPROVED' },
    include: { laboratory: true },
    orderBy: { reservationDate: 'asc' },
  })).filter((request) => request.reservationDate > now);

  return (
    <ScheduleCalendar
      requests={requests.map((request) => ({
        id: request.id,
        status: request.status,
        reservationDate: request.reservationDate,
        startDate: request.startDate,
        endDate: request.endDate,
        recurrencePattern: request.recurrencePattern,
        startTime: request.startTime,
        endTime: request.endTime,
        laboratory: { name: request.laboratory.name },
      }))}
    />
  );
}

