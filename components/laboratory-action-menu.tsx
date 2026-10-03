'use client';

import { useState } from 'react';
import { deleteLaboratory, updateLaboratory } from '@/lib/actions';

type LaboratoryActionMenuProps = {
  laboratory: {
    id: string;
    name: string;
    code: string;
    location: string;
    capacity: number;
    status: string;
    description: string | null;
  };
};

export function LaboratoryActionMenu({ laboratory }: LaboratoryActionMenuProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedAction}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedAction(value);
            if (value === 'delete') {
              setConfirmOpen(true);
            }
          }}
          className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
          aria-label="Laboratory actions"
        >
          <option value="">Select action</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      {selectedAction === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white py-2">
              <h2 className="text-xl font-semibold text-slate-900">Edit Laboratory</h2>
              <button
                type="button"
                onClick={() => setSelectedAction('')}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form action={updateLaboratory} className="space-y-4">
              <input type="hidden" name="id" value={laboratory.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" defaultValue={laboratory.name} placeholder="Laboratory name" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <input name="code" defaultValue={laboratory.code} placeholder="Lab code" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <input name="location" defaultValue={laboratory.location} placeholder="Location" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" required />
                <input type="number" name="capacity" min={1} defaultValue={laboratory.capacity} placeholder="Capacity" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <select name="status" defaultValue={laboratory.status} className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="INSPECTION">INSPECTION</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <textarea name="description" defaultValue={laboratory.description ?? ''} placeholder="Description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setSelectedAction('')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-medium text-slate-900">{laboratory.name}</span>?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setSelectedAction('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <form action={deleteLaboratory}>
                <input type="hidden" name="id" value={laboratory.id} />
                <button
                  type="submit"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
