'use client';

import { useState } from 'react';

const checks = [
  ['internetConnected', 'Internet'],
  ['monitorFunctional', 'Monitor'],
  ['mouseFunctional', 'Mouse'],
  ['powerCableFunctional', 'Power cable'],
  ['wallOutletFunctional', 'Power wall outlet'],
  ['osFunctional', 'Operating system'],
] as const;

type InspectionDetail = {
  id: string;
  computerName: string;
  assetNumber: string;
  statusAfter: string | null;
  notes: string | null;
  internetConnected: boolean | null;
  monitorFunctional: boolean | null;
  mouseFunctional: boolean | null;
  powerCableFunctional: boolean | null;
  wallOutletFunctional: boolean | null;
  osFunctional: boolean | null;
};

export type InspectionHistoryGroup = {
  id: string;
  laboratoryId: string;
  laboratoryName: string;
  inspectorName: string;
  inspectedAt: string;
  inspections: InspectionDetail[];
};

function checkResult(value: boolean | null, label: string) {
  if (value === null) return 'N/A';
  if (label === 'Internet') return value ? 'Connected' : 'Not connected';
  return value ? 'Working' : 'Not working';
}

export function InspectionHistory({ groups }: { groups: InspectionHistoryGroup[] }) {
  const [selectedGroup, setSelectedGroup] = useState<InspectionHistoryGroup | null>(null);

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => {
          const functionalCount = group.inspections.filter((inspection) => inspection.statusAfter === 'FUNCTIONAL').length;
          const nonFunctionalCount = group.inspections.filter((inspection) => inspection.statusAfter === 'NON_FUNCTIONAL').length;

          return (
            <article key={group.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900">{group.laboratoryName}</h3>
                  <p className="text-sm text-slate-600">Inspected by {group.inspectorName}</p>
                  <p className="text-sm text-slate-600">{new Date(group.inspectedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                    Functional: {functionalCount}
                  </span>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-800">
                    Non-functional: {nonFunctionalCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    See details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspection-detail-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="sticky top-0 z-10 mb-4 flex items-start justify-between gap-4 bg-white py-2">
              <div>
                <h3 id="inspection-detail-title" className="text-xl font-semibold text-slate-900">
                  Inspection details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedGroup.laboratoryName} · {selectedGroup.inspectorName} ·{' '}
                  {new Date(selectedGroup.inspectedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {selectedGroup.inspections.map((inspection) => (
                <article key={inspection.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-900">
                      {inspection.computerName} <span className="font-normal text-slate-500">· {inspection.assetNumber}</span>
                    </h4>
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        inspection.statusAfter === 'FUNCTIONAL'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800',
                      ].join(' ')}
                    >
                      {inspection.statusAfter ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {checks.map(([field, label]) => (
                      <div key={field} className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-medium text-slate-900">
                          {checkResult(inspection[field], label)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {inspection.notes && <p className="mt-3 text-sm text-slate-600">Notes: {inspection.notes}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
