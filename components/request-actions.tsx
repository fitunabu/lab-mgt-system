'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  approveRequest,
  approveTerminationRequest,
  deleteLaboratoryRequest,
  rejectRequest,
  requestTermination,
  updateLaboratoryRequest,
} from '@/lib/actions';

type RequestActorRole = 'ADMIN' | 'TECHNICAL_ASSISTANT' | 'TEACHER';

type RequestActionProps = {
  request: {
    id: string;
    teacherId: string;
    teacher: { name: string };
    laboratory: { id: string; name: string };
    laboratoryId: string;
    reservationDate: Date;
    startDate?: Date | null;
    endDate?: Date | null;
    recurrencePattern?: string | null;
    startTime: string;
    endTime: string;
    course: string;
    studentCount: number;
    purpose: string;
    status: string;
    rejectionReason?: string | null;
  };
  laboratories?: Array<{ id: string; name: string; code: string }>;
  role?: RequestActorRole;
  isOwner?: boolean;
};

export function RequestActions({ request, laboratories = [], role, isOwner = false }: RequestActionProps) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [terminationOpen, setTerminationOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    laboratoryId: request.laboratoryId,
    startDate: request.startDate ? new Date(request.startDate).toISOString().slice(0, 10) : new Date(request.reservationDate).toISOString().slice(0, 10),
    endDate: request.endDate ? new Date(request.endDate).toISOString().slice(0, 10) : new Date(request.reservationDate).toISOString().slice(0, 10),
    recurrence: (request.recurrencePattern as 'once' | 'daily' | 'weekly' | 'monthly') || 'once',
    course: request.course,
    studentCount: String(request.studentCount),
    purpose: request.purpose,
    timeSlots: [{ start: request.startTime, end: request.endTime }],
  });

  const isBeforeDueDate = Date.now() < new Date(request.reservationDate).getTime();
  const isPendingTeacherAction = role === 'TEACHER' && isOwner && request.status === 'PENDING' && isBeforeDueDate;
  const isApprovedTeacherAction =
    role === 'TEACHER' &&
    isOwner &&
    request.status === 'APPROVED' &&
    isBeforeDueDate;
  const isAssistantAction = role === 'TECHNICAL_ASSISTANT' && request.status === 'PENDING' && isBeforeDueDate;
  const isAssistantTerminationAction = role === 'TECHNICAL_ASSISTANT' && request.status === 'TERMINATION_REQUESTED';

  const addTimeSlot = () => {
    setForm((current) => ({ ...current, timeSlots: [...current.timeSlots, { start: '', end: '' }] }));
  };

  const removeTimeSlot = (index: number) => {
    setForm((current) => ({
      ...current,
      timeSlots: current.timeSlots.length === 1 ? [{ start: '', end: '' }] : current.timeSlots.filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setForm((current) => ({
      ...current,
      timeSlots: current.timeSlots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: value } : slot)),
    }));
  };

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setEditError(null);

    const normalizedSlots = form.timeSlots.filter((slot) => slot.start && slot.end);
    if (!normalizedSlots.length) {
      setEditError('Select at least one time slot.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.set('id', request.id);
    formData.set('laboratoryId', form.laboratoryId);
    formData.set('startDate', form.startDate);
    formData.set('endDate', form.endDate);
    formData.set('recurrence', form.recurrence);
    formData.set('reservationDate', form.startDate);
    formData.set('course', form.course);
    formData.set('studentCount', form.studentCount);
    formData.set('purpose', form.purpose);

    normalizedSlots.forEach((slot) => {
      formData.append('timeSlotStart', slot.start);
      formData.append('timeSlotEnd', slot.end);
    });

    try {
      await updateLaboratoryRequest(formData);
      setEditOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Unable to update request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isAssistantAction && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => approveRequest(request.id)}
            className="rounded bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setRejectOpen(true)}
            className="rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      )}

      {isPendingTeacherAction && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}

      {isApprovedTeacherAction && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTerminationOpen(true)}
            className="rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Terminate
          </button>
        </div>
      )}

      {isAssistantTerminationAction && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await approveTerminationRequest(request.id);
              router.refresh();
            }}
            className="rounded bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Approve Termination
          </button>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Reject request</h3>
            <p className="mt-2 text-sm text-slate-600">Provide a reason so the teacher can review the rejection.</p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Reason for rejection"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setReason('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reason.trim()) return;
                  await rejectRequest(request.id, reason.trim());
                  setRejectOpen(false);
                  setReason('');
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                disabled={!reason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {terminationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Terminate approved request</h3>
            <p className="mt-2 text-sm text-slate-600">Tell the assistant why this reservation needs to be terminated.</p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Reason for termination"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setTerminationOpen(false);
                  setReason('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reason.trim()) return;
                  await requestTermination(request.id, reason.trim());
                  setTerminationOpen(false);
                  setReason('');
                  router.refresh();
                }}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                disabled={!reason.trim()}
              >
                Submit Termination
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Edit request</h3>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Laboratory</label>
                  <select
                    value={form.laboratoryId}
                    onChange={(e) => setForm((current) => ({ ...current, laboratoryId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {laboratories.length > 0 ? (
                      laboratories.map((lab) => (
                        <option key={lab.id} value={lab.id}>
                          {lab.name} ({lab.code})
                        </option>
                      ))
                    ) : (
                      <option value={request.laboratoryId}>{request.laboratory.name}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Booking Pattern</label>
                  <select
                    value={form.recurrence}
                    onChange={(e) => setForm((current) => ({ ...current, recurrence: e.target.value as 'once' | 'daily' | 'weekly' | 'monthly' }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="once">Single day</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Course / Subject</label>
                  <input
                    type="text"
                    value={form.course}
                    onChange={(e) => setForm((current) => ({ ...current, course: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Number of Students</label>
                  <input
                    type="number"
                    min={1}
                    value={form.studentCount}
                    onChange={(e) => setForm((current) => ({ ...current, studentCount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700">Time slots</label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                  >
                    + Add time
                  </button>
                </div>

                <div className="space-y-3">
                  {form.timeSlots.map((slot, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot {index + 1}</span>
                        {form.timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Start time</label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">End time</label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Purpose</label>
                <textarea
                  rows={4}
                  value={form.purpose}
                  onChange={(e) => setForm((current) => ({ ...current, purpose: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditError(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete request</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete this request for <span className="font-medium text-slate-900">{request.laboratory.name}</span> on{' '}
              {new Date(request.reservationDate).toLocaleDateString()}?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteLaboratoryRequest(request.id);
                  setDeleteOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
