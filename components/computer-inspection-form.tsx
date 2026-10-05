'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { showToast } from '@/components/ui/toast-provider';
import { createComputerInspection } from '@/lib/actions';

type ComputerOption = {
  id: string;
  name: string;
  assetNumber: string;
  laboratoryId: string;
  laboratory: { name: string };
};
type LaboratoryOption = { id: string; name: string };
type CheckName = (typeof checks)[number]['name'];
type ComputerChecks = Partial<Record<CheckName, string>>;

const checkNames: CheckName[] = [
  'internetConnected',
  'monitorFunctional',
  'mouseFunctional',
  'powerCableFunctional',
  'wallOutletFunctional',
  'osFunctional',
];

const checks = [
  { name: 'internetConnected', label: 'Internet connection', pass: 'Connected', fail: 'Not connected' },
  { name: 'monitorFunctional', label: 'Monitor', pass: 'Working', fail: 'Not working' },
  { name: 'mouseFunctional', label: 'Mouse', pass: 'Working', fail: 'Not working' },
  { name: 'powerCableFunctional', label: 'Power cable', pass: 'Working', fail: 'Not working' },
  { name: 'wallOutletFunctional', label: 'Power wall outlet', pass: 'Working', fail: 'Not working' },
  { name: 'osFunctional', label: 'Operating system', pass: 'Working', fail: 'Not working' },
] as const;

export function ComputerInspectionForm({
  computers,
  laboratories,
}: {
  computers: ComputerOption[];
  laboratories: LaboratoryOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedComputerIds, setSelectedComputerIds] = useState<Set<string>>(new Set());
  const [computerChecks, setComputerChecks] = useState<Record<string, ComputerChecks>>({});
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState(laboratories[0]?.id ?? '');

  const laboratoryComputers = computers.filter((computer) => computer.laboratoryId === selectedLaboratoryId);
  const allComputersSelected = selectedComputerIds.size === laboratoryComputers.length;

  const toggleComputerSelection = (computerId: string) => {
    setSelectedComputerIds((current) => {
      const next = new Set(current);
      if (next.has(computerId)) {
        next.delete(computerId);
      } else {
        next.add(computerId);
      }
      return next;
    });
  };

  const applyChecksToSelected = (sourceComputerId: string) => {
    const sourceChecks = computerChecks[sourceComputerId] ?? {};
    if (checkNames.some((checkName) => !sourceChecks[checkName])) {
      setFormError('Complete all six checks for the source computer before applying them.');
      return;
    }
    if (selectedComputerIds.size === 0) {
      setFormError('Select at least one computer to apply these checks to.');
      return;
    }

    setComputerChecks((current) => {
      const next = { ...current };
      for (const computerId of selectedComputerIds) {
        next[computerId] = { ...sourceChecks };
      }
      return next;
    });
    setFormError('');
    showToast('success', `Checks applied to ${selectedComputerIds.size} selected computers. Notes are unchanged.`);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setFormError('');
      await createComputerInspection(formData);
      formRef.current?.reset();
      setOpen(false);
      setSelectedComputerIds(new Set());
      setComputerChecks({});
      router.refresh();
      showToast('success', `Inspection saved for all ${laboratoryComputers.length} computers.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record the inspection.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormError('');
          setOpen(true);
        }}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Inspect all computers
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="computer-inspection-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-4 bg-white py-2">
              <div>
                <h2 id="computer-inspection-title" className="text-xl font-semibold text-slate-900">
                  Inspect all computers in one laboratory
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete every check for all registered computers in the selected laboratory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(new FormData(event.currentTarget));
              }}
              className="space-y-4"
            >
              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {formError}
                </p>
              )}

              <label className="block max-w-xl text-sm font-medium text-slate-700">
                Laboratory
                <select
                  name="laboratoryId"
                  required
                  value={selectedLaboratoryId}
                  onChange={(event) => {
                    setSelectedLaboratoryId(event.currentTarget.value);
                    setSelectedComputerIds(new Set());
                    setFormError('');
                  }}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {laboratories.map((laboratory) => (
                    <option key={laboratory.id} value={laboratory.id}>{laboratory.name}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={allComputersSelected}
                    onChange={(event) => {
                      setSelectedComputerIds(
                        event.currentTarget.checked
                          ? new Set(laboratoryComputers.map((computer) => computer.id))
                          : new Set(),
                      );
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Select all computers
                </label>
                <p className="text-sm text-slate-600">
                  {selectedComputerIds.size} selected · {laboratoryComputers.length} computers in this lab
                </p>
              </div>

              <div className="space-y-4">
                {laboratoryComputers.map((computer) => (
                  <fieldset key={computer.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 font-semibold text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedComputerIds.has(computer.id)}
                          onChange={() => toggleComputerSelection(computer.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        {computer.name} <span className="font-normal text-slate-500">· {computer.assetNumber}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => applyChecksToSelected(computer.id)}
                        disabled={selectedComputerIds.size === 0}
                        className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply this computer&apos;s checks to selected
                      </button>
                    </div>
                    <input type="hidden" name="computerId" value={computer.id} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {checks.map((check) => (
                        <label key={check.name} className="block text-sm font-medium text-slate-700">
                          {check.label}
                          <select
                            name={`${check.name}_${computer.id}`}
                            required
                            value={computerChecks[computer.id]?.[check.name] ?? ''}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              setComputerChecks((current) => ({
                                ...current,
                                [computer.id]: {
                                  ...current[computer.id],
                                  [check.name]: value,
                                },
                              }));
                            }}
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          >
                            <option value="" disabled>Select status</option>
                            <option value="true">{check.pass}</option>
                            <option value="false">{check.fail}</option>
                          </select>
                        </label>
                      ))}
                      <label className="block text-sm font-medium text-slate-700 lg:col-span-3">
                        Notes (optional)
                        <textarea
                          name={`notes_${computer.id}`}
                          rows={2}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </label>
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 bg-white py-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setComputerChecks({});
                    setSelectedComputerIds(new Set());
                  }}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving inspection...' : `Save all ${laboratoryComputers.length} inspections`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
