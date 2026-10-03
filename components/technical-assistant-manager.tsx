'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { createTechnicalAssistant, updateTechnicalAssistant } from '@/lib/actions';
import { showToast } from '@/components/ui/toast-provider';

type TechnicalAssistant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  assignedLaboratoryId: string | null;
  assignedLaboratory: { id: string; name: string; code: string } | null;
};

type TechnicalAssistantManagerProps = {
  assistants: TechnicalAssistant[];
  laboratories: Array<{ id: string; name: string; code: string }>;
};

export function TechnicalAssistantManager({ assistants, laboratories }: TechnicalAssistantManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<TechnicalAssistant | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setSelectedAssistant(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (assistant: TechnicalAssistant) => {
    setSelectedAssistant(assistant);
    setFormError('');
    setModalOpen(true);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const formData = new FormData(event.currentTarget);
    if (selectedAssistant) formData.set('id', selectedAssistant.id);

    try {
      if (selectedAssistant) {
        await updateTechnicalAssistant(formData);
        showToast('success', 'Technical assistant updated.');
      } else {
        await createTechnicalAssistant(formData);
        showToast('success', 'Technical assistant added.');
      }
      setModalOpen(false);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save technical assistant.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-600">Manage technical assistant accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Assistant
        </button>
      </div>

      <div className="app-table-shell">
        <table className="app-data-table app-data-table--users">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 font-medium text-slate-600">Phone</th>
              <th className="px-4 py-3 font-medium text-slate-600">Assigned Laboratory</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assistants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No technical assistants found.</td>
              </tr>
            ) : (
              assistants.map((assistant) => (
                <tr key={assistant.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                        {assistant.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-900">{assistant.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{assistant.email}</td>
                  <td className="px-4 py-3">{assistant.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {assistant.assignedLaboratory
                      ? `${assistant.assignedLaboratory.name} (${assistant.assignedLaboratory.code})`
                      : 'Unassigned'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${assistant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                      {assistant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(assistant)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-form-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <header className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white py-2">
              <h2 id="assistant-form-title" className="text-lg font-semibold text-slate-900">
                {selectedAssistant ? 'Edit Technical Assistant' : 'Add Technical Assistant'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close assistant form"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <form key={selectedAssistant?.id ?? 'new-assistant'} onSubmit={handleSubmit} className="space-y-4">
              {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Full name
                  <input name="name" defaultValue={selectedAssistant?.name ?? ''} required minLength={2} className="w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Email
                  <input name="email" type="email" defaultValue={selectedAssistant?.email ?? ''} required className="w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Phone
                  <input name="phone" type="tel" defaultValue={selectedAssistant?.phone ?? ''} className="w-full rounded-md border border-slate-300 px-3 py-2 font-normal" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Assigned laboratory
                  <select name="assignedLaboratoryId" defaultValue={selectedAssistant?.assignedLaboratoryId ?? ''} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
                    <option value="">Unassigned</option>
                    {laboratories.map((laboratory) => (
                      <option key={laboratory.id} value={laboratory.id}>{laboratory.name} ({laboratory.code})</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  Status
                  <select name="status" defaultValue={selectedAssistant?.status ?? 'ACTIVE'} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  {selectedAssistant ? 'New password' : 'Password'}
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required={!selectedAssistant}
                    minLength={8}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
                  />
                  {selectedAssistant && <span className="block text-xs font-normal text-slate-500">Leave blank to keep the current password.</span>}
                </label>
              </div>

              <footer className="sticky bottom-0 flex justify-end gap-3 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : selectedAssistant ? 'Save Changes' : 'Create Assistant'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}