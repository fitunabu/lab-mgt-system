'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createEquipment } from '@/lib/actions';
import { showToast } from '@/components/ui/toast-provider';

export function EquipmentModal({ labs }: { labs: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState('COMPUTER');
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState('');
  const assetNumberInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      setFormError('');
      await createEquipment(formData);
      setOpen(false);
      router.refresh();
      showToast('success', 'Equipment created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add equipment.';
      setFormError(message);
      assetNumberInputRef.current?.focus();
      assetNumberInputRef.current?.select();
      assetNumberInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add Equipment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:items-center sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white py-2">
              <h2 className="text-xl font-semibold text-slate-900">Add Equipment</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  ref={assetNumberInputRef}
                  name="assetNumber"
                  placeholder="Asset number"
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="Quantity"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
                <input name="name" placeholder="Equipment name" className="rounded-lg border border-slate-300 px-3 py-2" required />
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
                <select name="laboratoryId" className="rounded-lg border border-slate-300 px-3 py-2" required>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
                <input name="brand" placeholder="Brand" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="model" placeholder="Model" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="serialNumber" placeholder="Serial number" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input type="date" name="purchaseDate" className="rounded-lg border border-slate-300 px-3 py-2" />
                <select name="status" className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="FUNCTIONAL">FUNCTIONAL</option>
                  <option value="NON_FUNCTIONAL">NON_FUNCTIONAL</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  <option value="DAMAGED">DAMAGED</option>
                  <option value="MISSING">MISSING</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
                <select name="condition" className="rounded-lg border border-slate-300 px-3 py-2">
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                </select>
                {equipmentType === 'COMPUTER' && (
                  <>
                    <input name="hardDiskSize" placeholder="Hard disk size (e.g. 512 GB)" className="rounded-lg border border-slate-300 px-3 py-2" />
                    <input name="ramSize" placeholder="RAM size (e.g. 16 GB)" className="rounded-lg border border-slate-300 px-3 py-2" />
                    <input name="installedOS" placeholder="Installed OS (e.g. Windows 11)" className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
                  </>
                )}

                <textarea name="notes" placeholder="Notes" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" />
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Create Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
