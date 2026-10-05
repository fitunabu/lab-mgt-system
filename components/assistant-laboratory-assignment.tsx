'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { assignAssistantLaboratory } from '@/lib/actions';
import { showToast } from '@/components/ui/toast-provider';

type Assistant = {
  id: string;
  name: string;
  assignedLaboratories: Array<{ id: string; name: string; code: string }>;
};

type Laboratory = { id: string; name: string; code: string };

export function AssistantLaboratoryAssignment({
  assistant,
  laboratories,
}: {
  assistant: Assistant;
  laboratories: Laboratory[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await assignAssistantLaboratory(formData);
      showToast(
        'success',
        result.assignedCount
          ? `Laboratory assignments saved for ${assistant.name}.`
          : `All laboratory assignments removed from ${assistant.name}.`,
      );
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save laboratory assignments.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <input type="hidden" name="assistantId" value={assistant.id} />
      <div>
        <p className="font-medium text-slate-900">{assistant.name}</p>
        <p className="text-sm text-slate-600">
          {assistant.assignedLaboratories.length > 0
            ? assistant.assignedLaboratories.map((laboratory) => `${laboratory.name} (${laboratory.code})`).join(', ')
            : 'No laboratory assigned'}
        </p>
      </div>

      <div className="flex w-full max-w-md items-end gap-3">
        <fieldset className="grid flex-1 gap-2 rounded-lg border border-slate-300 p-3 sm:grid-cols-2">
          <legend className="px-1 text-xs font-medium text-slate-600">Assigned laboratories</legend>
          {laboratories.map((laboratory) => (
            <label key={laboratory.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="laboratoryIds"
                value={laboratory.id}
                defaultChecked={assistant.assignedLaboratories.some((assigned) => assigned.id === laboratory.id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              {laboratory.name} ({laboratory.code})
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
