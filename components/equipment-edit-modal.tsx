'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { updateEquipment } from '@/lib/actions';
import { showToast } from '@/components/ui/toast-provider';

type EquipmentEditModalProps = {
  equipment: {
    id: string;
    assetNumber: string;
    equipmentType: string;
    name: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    hardDiskSize?: string | null;
    ramSize?: string | null;
    installedOS?: string | null;
    laboratoryId: string;
    status: string;
    condition: string;
    purchaseDate: Date | null;
    notes: string | null;
  };
  labs: Array<{ id: string; name: string }>;
  autoOpen?: boolean;
  onClose?: () => void;
};

export function EquipmentEditModal({ equipment, labs, autoOpen = false, onClose }: EquipmentEditModalProps) {
  const [open, setOpen] = useState(autoOpen);
  const [equipmentType, setEquipmentType] = useState(equipment.equipmentType);
  const [formError, setFormError] = useState('');
  const assetNumberInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setFormError('');
      await updateEquipment(formData);
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update equipment.';
      setFormError(message);
      assetNumberInputRef.current?.focus();
      assetNumberInputRef.current?.select();
      assetNumberInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      {!autoOpen && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Edit
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white py-2">
              <h2 className="text-xl font-semibold text-slate-900">Edit Equipment</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                void handleSubmit(formData);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={equipment.id} />

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  ref={assetNumberInputRef}
                  name="assetNumber"
                  defaultValue={equipment.assetNumber}
                  placeholder="Asset number"
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
                <input name="name" defaultValue={equipment.name} placeholder="Equipment name" className="rounded-lg border border-slate-300 px-3 py-2" required />
                <select
                  name="equipmentType"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="COMPUTER">Computer</option>
                  <option value="CHAIR">Chair</option>
                  <option value="MOUSE">Mouse</option>
                  <option value="KEYBOARD">Keyboard</option>
                  <option value="ADAPTER">Adapter</option>
                  <option value="OTHER">Other</option>
                </select>
                <select name="laboratoryId" defaultValue={equipment.laboratoryId} className="rounded-lg border border-slate-300 px-3 py-2" required>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
                <input name="brand" defaultValue={equipment.brand ?? ''} placeholder="Brand" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="model" defaultValue={equipment.model ?? ''} placeholder="Model" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="serialNumber" defaultValue={equipment.serialNumber ?? ''} placeholder="Serial number" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input type="date" name="purchaseDate" defaultValue={equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().slice(0, 10) : ''} className="rounded-lg border border-slate-300 px-3 py-2" />
                <select name="status" defaultValue={equipment.status} className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="FUNCTIONAL">FUNCTIONAL</option>
                  <option value="NON_FUNCTIONAL">NON_FUNCTIONAL</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  <option value="DAMAGED">DAMAGED</option>
                  <option value="MISSING">MISSING</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
                <select name="condition" defaultValue={equipment.condition} className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                </select>
                {equipmentType === 'COMPUTER' && (
                  <>
                    <input name="hardDiskSize" defaultValue={equipment.hardDiskSize ?? ''} placeholder="Hard disk size (e.g. 512 GB)" className="rounded-lg border border-slate-300 px-3 py-2" />
                    <input name="ramSize" defaultValue={equipment.ramSize ?? ''} placeholder="RAM size (e.g. 16 GB)" className="rounded-lg border border-slate-300 px-3 py-2" />
                    <input name="installedOS" defaultValue={equipment.installedOS ?? ''} placeholder="Installed OS (e.g. Windows 11)" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
                  </>
                )}

                <textarea name="notes" defaultValue={equipment.notes ?? ''} placeholder="Notes" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 bg-white py-3">
                <button
                  type="button"
                  onClick={closeModal}
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
    </>
  );
}
