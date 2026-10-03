import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusStyles: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  RESERVED: 'bg-sky-100 text-sky-800',
  OCCUPIED: 'bg-violet-100 text-violet-800',
  INSPECTION: 'bg-amber-100 text-amber-800',
  MAINTENANCE: 'bg-rose-100 text-rose-800',
  INACTIVE: 'bg-slate-200 text-slate-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-cyan-100 text-cyan-800',
  FUNCTIONAL: 'bg-emerald-100 text-emerald-800',
  NON_FUNCTIONAL: 'bg-red-100 text-red-800',
  DAMAGED: 'bg-orange-100 text-orange-800',
  MISSING: 'bg-purple-100 text-purple-800',
  UNDER_MAINTENANCE: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  INACTIVE_USER: 'bg-slate-200 text-slate-700',
};

export function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getNairobiDateRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getNairobiScheduledTimestamp(reservationDate: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return false;

  return Date.UTC(
    reservationDate.getUTCFullYear(),
    reservationDate.getUTCMonth(),
    reservationDate.getUTCDate(),
    hours - 3,
    minutes,
  );
}

export function isScheduledStartInFuture(reservationDate: Date, startTime: string, now = new Date()) {
  const scheduledStart = getNairobiScheduledTimestamp(reservationDate, startTime);
  return scheduledStart !== false && scheduledStart > now.getTime();
}

export function isScheduledEndInPast(reservationDate: Date, endTime: string, now = new Date()) {
  const scheduledEnd = getNairobiScheduledTimestamp(reservationDate, endTime);
  return scheduledEnd === false || scheduledEnd <= now.getTime();
}
