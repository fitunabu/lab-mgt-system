ALTER TABLE "EquipmentInspection"
ALTER COLUMN "sessionId" DROP NOT NULL,
    ADD COLUMN "internetConnected" BOOLEAN,
    ADD COLUMN "monitorFunctional" BOOLEAN,
    ADD COLUMN "mouseFunctional" BOOLEAN,
    ADD COLUMN "powerCableFunctional" BOOLEAN,
    ADD COLUMN "wallOutletFunctional" BOOLEAN,
    ADD COLUMN "osFunctional" BOOLEAN;