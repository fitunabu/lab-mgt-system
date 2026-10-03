import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">Laboratory usage report</div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">Equipment report</div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">Teacher usage report</div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">Equipment incident report</div>
      </div>
    </div>
  );
}
