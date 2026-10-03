import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ToastProvider } from '@/components/ui/toast-provider';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Laboratory Management System',
  description: 'Computer laboratory monitoring and reservation system',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ToastProvider />
        <AppShell
          isAuthenticated={Boolean(session?.user)}
          user={session?.user ?? null}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
