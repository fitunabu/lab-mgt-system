'use client';

import { useState } from 'react';
import { createLaboratory } from '@/lib/actions';

export function LaboratoryModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add Laboratory
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Add Laboratory</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form action={createLaboratory} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" placeholder="Laboratory name" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <input name="code" placeholder="Lab code" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <input name="location" placeholder="Location" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" required />
                <input type="number" name="capacity" min={1} placeholder="Capacity" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <select name="status" className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="INSPECTION">INSPECTION</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <textarea name="description" placeholder="Description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Create Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
