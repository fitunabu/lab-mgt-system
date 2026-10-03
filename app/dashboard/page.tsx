import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin, isTeacher, isTechnicalAssistant } from '@/lib/permissions';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  const role = (session?.user as any)?.role ?? 'TEACHER';

  if (isAdmin(role)) redirect('/dashboard/admin');
  if (isTechnicalAssistant(role)) redirect('/dashboard/technical-assistant');
  if (isTeacher(role)) redirect('/dashboard/teacher');

  return null;
}
