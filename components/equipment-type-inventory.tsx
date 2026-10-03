'use client';

import { useState } from 'react';
import { Boxes, Building2, Eye, X } from 'lucide-react';
import { EquipmentActionMenu } from '@/components/equipment-action-menu';
import { EmptyState } from '@/components/ui/empty-state';

type EquipmentItem = {
  id: string;
  assetNumber: string;
  equipmentType: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  hardDiskSize: string | null;
  ramSize: string | null;
  installedOS: string | null;
  laboratoryId: string;
  laboratory: { name: string };
  status: string;
  condition: string;
  purchaseDate: Date | null;
  notes: string | null;
};

type EquipmentTypeInventoryProps = {
  equipment: EquipmentItem[];
  labs: Array<{ id: string; name: string; code: string }>;
  canManageEquipment: boolean;
};

const equipmentTypeOrder = ['COMPUTER', 'MOUSE', 'KEYBOARD', 'CHAIR', 'ADAPTER', 'OTHER'];
const equipmentStatuses = [
  { value: 'FUNCTIONAL', label: 'Functional', color: 'bg-green-100 text-green-800' },
  { value: 'NON_FUNCTIONAL', label: 'Non-functional', color: 'bg-red-100 text-red-800' },
  { value: 'UNDER_MAINTENANCE', label: 'Under maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DAMAGED', label: 'Damaged', color: 'bg-red-100 text-red-800' },
  { value: 'MISSING', label: 'Missing', color: 'bg-red-100 text-red-800' },
  { value: 'RETIRED', label: 'Retired', color: 'bg-red-100 text-red-800' },
];

function formatEquipmentType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function EquipmentTypeInventory({ equipment, labs, canManageEquipment }: EquipmentTypeInventoryProps) {
  const [selectedDetails, setSelectedDetails] = useState<{ laboratoryId: string; type: string } | null>(null);
  const laboratoryGroups = labs.map((laboratory) => ({
    laboratory,
    equipment: equipment.filter((item) => item.laboratoryId === laboratory.id),
  }));
  const selectedLaboratory = selectedDetails
    ? labs.find((laboratory) => laboratory.id === selectedDetails.laboratoryId)
    : null;
  const selectedEquipment = selectedDetails
    ? equipment.filter((item) => item.laboratoryId === selectedDetails.laboratoryId && item.equipmentType === selectedDetails.type)
    : [];

  return (
    <>
      {equipment.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-12 w-12" strokeWidth={1.7} />}
          title="No equipment registered"
          description="The equipment inventory is empty."
          tone="teal"
        />
      ) : (
      <div className="space-y-5">
        {laboratoryGroups.map(({ laboratory, equipment: labEquipment }) => {
          const groupedEquipment = labEquipment.reduce<Record<string, EquipmentItem[]>>((groups, item) => {
            (groups[item.equipmentType] ??= []).push(item);
            return groups;
          }, {});
          const typeGroups = Object.entries(groupedEquipment).sort(([firstType], [secondType]) => {
            const firstOrder = equipmentTypeOrder.indexOf(firstType);
            const secondOrder = equipmentTypeOrder.indexOf(secondType);
            return (firstOrder < 0 ? equipmentTypeOrder.length : firstOrder) - (secondOrder < 0 ? equipmentTypeOrder.length : secondOrder);
          });

          return (
            <section key={laboratory.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <header className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900">{laboratory.name}</h2>
                    <p className="text-xs font-medium text-slate-500">{laboratory.code}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {labEquipment.length} {labEquipment.length === 1 ? 'item' : 'items'}
                </span>
              </header>

              {labEquipment.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No equipment registered in this laboratory.
                </p>
              ) : (
                <div className="app-table-shell">
                  <table className="app-data-table">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600">Equipment Type</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Total</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Status Counts</th>
                        <th className="px-4 py-3 font-medium text-slate-600">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeGroups.map(([type, items]) => {
                const statusCounts = items.reduce<Record<string, number>>((counts, item) => {
                  counts[item.status] = (counts[item.status] ?? 0) + 1;
                  return counts;
                }, {});

                return (
                  <tr key={type} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{formatEquipmentType(type)}</td>
                    <td className="px-4 py-3 tabular-nums">{items.length}</td>
                    <td className="px-4 py-3">
                      <div className="grid min-w-[360px] grid-cols-3 gap-x-3 gap-y-1 text-xs">
                        {equipmentStatuses.map((status) => (
                          <div key={status.value} className={`flex justify-between gap-2 rounded px-1.5 py-0.5 ${status.color}`}>
                            <span>{status.label}</span>
                            <span className="font-semibold tabular-nums">{statusCounts[status.value] ?? 0}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDetails({ laboratoryId: laboratory.id, type })}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
      )}

      {selectedDetails && selectedLaboratory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="equipment-details-title"
            className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 id="equipment-details-title" className="text-lg font-semibold text-slate-900">
                  {formatEquipmentType(selectedDetails.type)} Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">{selectedLaboratory.name} · {selectedEquipment.length} items</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                aria-label="Close equipment details"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[calc(90vh-5rem)] overflow-auto">
              <table className="app-data-table">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Asset</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Laboratory</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Brand / Model</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Serial Number</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Status / Condition</th>
                    {canManageEquipment && <th className="px-4 py-3 font-medium text-slate-600">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedEquipment.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top">
                      <td className="px-4 py-3">{item.assetNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {item.equipmentType === 'COMPUTER' && (
                          <div className="mt-1 text-xs text-slate-500">
                            {[item.ramSize, item.hardDiskSize, item.installedOS].filter(Boolean).join(' / ') || 'No specifications'}
                          </div>
                        )}
                        {item.notes && <div className="mt-1 max-w-xs text-xs text-slate-500">{item.notes}</div>}
                      </td>
                      <td className="px-4 py-3">{item.laboratory.name}</td>
                      <td className="px-4 py-3">{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-4 py-3">{item.serialNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${equipmentStatuses.find((status) => status.value === item.status)?.color ?? 'bg-slate-100 text-slate-700'}`}>
                          {item.status.replaceAll('_', ' ')}
                        </span>
                        <div className="mt-1 text-xs text-slate-500">{item.condition}</div>
                      </td>
                      {canManageEquipment && (
                        <td className="px-4 py-3">
                          <EquipmentActionMenu equipment={item} labs={labs} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}