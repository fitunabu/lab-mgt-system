'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Building2, ClipboardCheck, FileText, LogOut, Menu, ShieldCheck, UserCog, X } from 'lucide-react';
import type { ReactNode } from 'react';
import lmsLogo from '../app/LMS-01.png';

const iconMap = {
  Dashboard: BarChart3,
  Requests: FileText,
  Laboratories: Building2,
  Equipment: ClipboardCheck,
  Inspections: ShieldCheck,
  Reports: BarChart3,
  'Request Laboratory': FileText,
  'My Requests': FileText,
  'My Reservations': FileText,
  Schedule: Building2,
} as const;

type AppShellProps = {
  children: ReactNode;
  isAuthenticated: boolean;
  user?: {
    name?: string | null;
    role?: string | null;
  } | null;
  assignedLaboratories?: Array<{
    name: string;
    code: string;
  }>;
};

export function AppShell({ children, isAuthenticated, user, assignedLaboratories = [] }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>;
  }

  const role = (user?.role ?? 'TEACHER') as string;

  const navItems = [
    ...((role === 'ADMIN' || role === 'TECHNICAL_ASSISTANT')
      ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Requests', href: '/requests' },
          { label: 'Laboratories', href: '/laboratories' },
          { label: 'Equipment', href: '/equipment' },
          { label: 'Inspections', href: '/inspections' },
          { label: 'Reports', href: '/reports' },
        ]
      : [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Request Laboratory', href: '/requests/new' },
          { label: 'My Requests', href: '/requests' },
          { label: 'My Reservations', href: '/reservations' },
          { label: 'Schedule', href: '/schedule' },
        ]),
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-900 p-5 text-slate-100 md:block">
          <div className="mb-8 flex items-center gap-3">
            <Image src={lmsLogo} alt="LMS logo" priority className="h-11 w-11 rounded-lg bg-white p-1 object-contain" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lab</p>
              <h1 className="text-lg font-semibold">Management</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ label, href }) => {
              const Icon = iconMap[label as keyof typeof iconMap] ?? BarChart3;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-slate-200 transition hover:bg-slate-800"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}

            {role === 'ADMIN' && (
              <Link href="/users" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-slate-200 transition hover:bg-slate-800">
                <UserCog className="h-5 w-5" />
                Users
              </Link>
            )}

            <form action="/api/auth/signout" method="post" className="pt-8">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-700 px-3 py-2.5 text-base text-slate-200 transition hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </form>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">Welcome back</p>
              <h2 className="text-xl font-semibold text-slate-900">{user?.name ?? 'User'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-700">
                  {role}
                </div>
                {role === 'TECHNICAL_ASSISTANT' && (
                  <p className="text-xs text-slate-600">
                    Assigned labs:{' '}
                    {assignedLaboratories.length
                      ? assignedLaboratories.map((laboratory) => `${laboratory.name} (${laboratory.code})`).join(', ')
                      : 'Unassigned'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            {mobileMenuOpen && (
              <nav id="mobile-navigation" className="w-full space-y-1 border-t border-slate-200 pt-3 md:hidden">
                {navItems.map(({ label, href }) => {
                  const Icon = iconMap[label as keyof typeof iconMap] ?? BarChart3;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-slate-700 transition hover:bg-slate-100"
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  );
                })}
                {role === 'ADMIN' && (
                  <Link
                    href="/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-slate-700 transition hover:bg-slate-100"
                  >
                    <UserCog className="h-5 w-5" />
                    Users
                  </Link>
                )}
                <form action="/api/auth/signout" method="post" className="pt-2">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-700 transition hover:bg-slate-100"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </form>
              </nav>
            )}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
