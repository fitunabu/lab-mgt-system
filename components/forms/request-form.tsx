'use client';

import { useState } from 'react';
import { createLaboratoryRequest } from '@/lib/actions';

export function RequestForm({ laboratories }: { laboratories: Array<{ id: string; name: string; code: string }> }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [timeSlots, setTimeSlots] = useState([{ start: '', end: '' }]);
  const [formValues, setFormValues] = useState({
    startDate: '',
    endDate: '',
    course: '',
    studentCount: '',
    purpose: '',
  });

  const addTimeSlot = () => {
    setTimeSlots((current) => [...current, { start: '', end: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots((current) => {
      if (current.length === 1) {
        return [{ start: '', end: '' }];
      }
      return current.filter((_, slotIndex) => slotIndex !== index);
    });
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    setTimeSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, [field]: value } : slot))
    );
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const purposeValue = formValues.purpose.trim();
    if (!purposeValue) {
      setError('Purpose is required.');
      setLoading(false);
      return;
    }

    if (!formValues.startDate && !formValues.endDate) {
      setError('Select a date.');
      setLoading(false);
      return;
    }

    const timeStartValues = timeSlots.map((slot) => slot.start).filter(Boolean);
    const timeEndValues = timeSlots.map((slot) => slot.end).filter(Boolean);

    if (timeStartValues.length !== timeEndValues.length) {
      setError('Each time slot needs both a start and end time.');
      setLoading(false);
      return;
    }

    timeSlots.forEach((slot) => {
      if (slot.start && slot.end) {
        formData.append('timeSlotStart', slot.start);
        formData.append('timeSlotEnd', slot.end);
      }
    });

    formData.set('recurrence', recurrence);
    formData.set('purpose', purposeValue);
    formData.set('course', formValues.course.trim());
    formData.set('studentCount', formValues.studentCount || '0');
    formData.set('startDate', formValues.startDate);
    formData.set('endDate', formValues.endDate);

    try {
      await createLaboratoryRequest(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Laboratory</label>
          <select name="laboratoryId" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {laboratories.map((lab) => (
              <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Booking Pattern</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as 'once' | 'daily' | 'weekly' | 'monthly')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="once">Single day</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formValues.startDate}
            onChange={(e) => setFormValues((current) => ({ ...current, startDate: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formValues.endDate}
            onChange={(e) => setFormValues((current) => ({ ...current, endDate: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Course / Subject</label>
          <input
            type="text"
            name="course"
            value={formValues.course}
            onChange={(e) => setFormValues((current) => ({ ...current, course: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Introduction to Programming"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Number of Students</label>
          <input
            type="number"
            name="studentCount"
            min={1}
            value={formValues.studentCount}
            onChange={(e) => setFormValues((current) => ({ ...current, studentCount: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="35"
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
          {timeSlots.map((slot, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot {index + 1}</span>
                {timeSlots.length > 1 && (
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
          name="purpose"
          rows={4}
          value={formValues.purpose}
          onChange={(e) => setFormValues((current) => ({ ...current, purpose: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Programming practical session"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
        {loading ? 'Submitting request...' : 'Submit Request'}
      </button>
    </form>
  );
}
