'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EquipmentEditModal } from './equipment-edit-modal';
import { deleteEquipment } from '@/lib/actions';
import { showToast } from '@/components/ui/toast-provider';

type EquipmentActionMenuProps = {
  equipment: {
    id: string;
    assetNumber: string;
    equipmentType: string;
    name: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    laboratoryId: string;
    status: string;
    condition: string;
    purchaseDate: Date | null;
    notes: string | null;
  };
  labs: Array<{ id: string; name: string }>;
};

export function EquipmentActionMenu({ equipment, labs }: EquipmentActionMenuProps) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChange = (value: string) => {
    setSelectedAction(value);
    if (value === 'delete') {
      setConfirmOpen(true);
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await deleteEquipment(formData);
      setConfirmOpen(false);
      setSelectedAction('');
      router.refresh();
      showToast('success', `${equipment.name} was deleted successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete equipment.';
      showToast('error', message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedAction}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
          aria-label="Equipment actions"
        >
          <option value="">Select action</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      {selectedAction === 'edit' && (
        <EquipmentEditModal
          equipment={equipment}
          labs={labs}
          autoOpen
          onClose={() => setSelectedAction('')}
        />
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-medium text-slate-900">{equipment.name}</span>?
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

              <form onSubmit={handleDelete}>
                <input type="hidden" name="id" value={equipment.id} />
                <button
                  type="submit"
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
