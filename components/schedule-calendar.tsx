'use client';

import { useMemo, useState } from 'react';

type ApprovedRequest = {
  id: string;
  status?: 'APPROVED' | 'CANCELLED' | 'REJECTED' | 'TERMINATION_REQUESTED' | 'PENDING' | 'COMPLETED';
  reservationDate: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  recurrencePattern?: string | null;
  startTime: string;
  endTime: string;
  laboratory: { name: string };
};

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalDate(date: Date) {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function getDatesBetween(start: Date, end: Date, pattern: string | null) {
  const dates: Date[] = [];
  const current = new Date(start.getTime());
  const last = new Date(end.getTime());

  while (current <= last) {
    dates.push(new Date(current));

    if (pattern === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (pattern === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (pattern === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
  }

  return dates;
}

function getApprovedDateSet(requests: ApprovedRequest[]) {
  const dateSet = new Set<string>();

  requests.forEach((request) => {
    if (request.status && request.status !== 'APPROVED') {
      return;
    }

    const date = new Date(request.reservationDate);
    dateSet.add(toLocalDateKey(date));
  });

  return dateSet;
}

function buildMonthDays(monthDate: Date) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const calendarDays: Array<{ date: Date | null; inMonth: boolean }> = [];

  for (let emptyIndex = 0; emptyIndex < firstWeekday; emptyIndex += 1) {
    calendarDays.push({ date: null, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push({ date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day), inMonth: true });
  }

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push({ date: null, inMonth: false });
  }

  return calendarDays;
}

export function ScheduleCalendar({ requests }: { requests: ApprovedRequest[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const approvedDates = useMemo(() => getApprovedDateSet(requests), [requests]);
  const calendarDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Laboratory Schedule</h1>
        <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          Approved bookings highlighted in red
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <button
              type="button"
              onClick={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-slate-900">{monthLabel}</h2>
            <button
              type="button"
              onClick={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell.date) {
                return <div key={`empty-${index}`} className="h-24 rounded-lg border border-slate-100 bg-slate-50" />;
              }

              const isoDate = toLocalDateKey(cell.date);
              const isApproved = approvedDates.has(isoDate);
              const isToday = isoDate === toLocalDateKey(new Date());

              return (
                <div
                  key={isoDate}
                  className={[
                    'flex h-24 flex-col rounded-lg border p-2 text-left transition',
                    cell.inMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 text-slate-400',
                    isApproved ? 'border-red-300 bg-red-100' : '',
                    isToday ? 'ring-2 ring-blue-200' : '',
                  ].join(' ')}
                >
                  <span className={['text-sm font-medium', isApproved ? 'text-red-700' : 'text-slate-700'].join(' ')}>
                    {cell.date.getDate()}
                  </span>
                  {isApproved && <span className="mt-auto text-[10px] font-medium text-red-700">Booked</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Approved bookings</h2>
          <div className="mt-4 space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No approved laboratory bookings yet.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-red-800">{request.laboratory.name}</p>
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white">Approved</span>
                  </div>
                  <p className="mt-1 text-xs text-red-700">
                    {formatLocalDate(new Date(request.reservationDate))} • {request.startTime} - {request.endTime}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
