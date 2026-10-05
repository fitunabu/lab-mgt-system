CREATE TABLE "_AssignedLaboratoryUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignedLaboratoryUsers_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "_AssignedLaboratoryUsers_B_index" ON "_AssignedLaboratoryUsers"("B");

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'User'
          AND column_name = 'assignedLaboratoryId'
    ) THEN
        EXECUTE 'INSERT INTO "_AssignedLaboratoryUsers" ("A", "B")
            SELECT "assignedLaboratoryId", "id"
            FROM "User"
            WHERE "assignedLaboratoryId" IS NOT NULL
            ON CONFLICT DO NOTHING';
    END IF;
END $$;

ALTER TABLE "_AssignedLaboratoryUsers"
ADD CONSTRAINT "_AssignedLaboratoryUsers_A_fkey"
FOREIGN KEY ("A") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_AssignedLaboratoryUsers"
ADD CONSTRAINT "_AssignedLaboratoryUsers_B_fkey"
FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_assignedLaboratoryId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "assignedLaboratoryId";
