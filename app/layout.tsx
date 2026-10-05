import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ToastProvider } from '@/components/ui/toast-provider';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Laboratory Management System',
  description: 'Computer laboratory monitoring and reservation system',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const assignedLaboratory =
    session?.user?.role === 'TECHNICAL_ASSISTANT'
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { assignedLaboratories: { select: { name: true, code: true } } },
        })
      : null;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ToastProvider />
        <AppShell
          isAuthenticated={Boolean(session?.user)}
          user={session?.user ?? null}
          assignedLaboratories={assignedLaboratory?.assignedLaboratories ?? []}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
