ALTER TABLE "EquipmentInspection"
ADD COLUMN "batchId" TEXT;

CREATE INDEX "EquipmentInspection_batchId_idx" ON "EquipmentInspection"("batchId");
