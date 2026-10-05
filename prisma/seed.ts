import {
  PrismaClient,
  UserRole,
  UserStatus,
  LaboratoryStatus,
  EquipmentType,
  EquipmentStatus,
  EquipmentCondition,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const users = [
    { name: 'System Admin', email: 'admin@example.com', role: UserRole.ADMIN, passwordHash: password },
    { name: 'Ahmed Assistant', email: 'assistant1@example.com', role: UserRole.TECHNICAL_ASSISTANT, passwordHash: password },
    { name: 'Selam Assistant', email: 'assistant2@example.com', role: UserRole.TECHNICAL_ASSISTANT, passwordHash: password },
    { name: 'Abebe Kebede', email: 'teacher1@example.com', role: UserRole.TEACHER, passwordHash: password },
    { name: 'Marta Tesfaye', email: 'teacher2@example.com', role: UserRole.TEACHER, passwordHash: password },
    { name: 'Daniel Bekele', email: 'teacher3@example.com', role: UserRole.TEACHER, passwordHash: password },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        status: UserStatus.ACTIVE,
        phone: '+251900000000',
      },
    });
  }

  const labs = [
    { name: 'Computer Lab 1', code: 'CL-001', location: 'Block A Floor 1', capacity: 35, description: 'Programming lab', status: LaboratoryStatus.AVAILABLE },
    { name: 'Computer Lab 2', code: 'CL-002', location: 'Block A Floor 2', capacity: 30, description: 'Networking lab', status: LaboratoryStatus.AVAILABLE },
    { name: 'Computer Lab 3', code: 'CL-003', location: 'Block B Floor 1', capacity: 40, description: 'Design lab', status: LaboratoryStatus.AVAILABLE },
  ];

  for (const lab of labs) {
    await prisma.laboratory.upsert({
      where: { code: lab.code },
      update: {},
      create: lab,
    });
  }

  const computerLab = await prisma.laboratory.findUnique({ where: { code: 'CL-001' } });
  const networkLab = await prisma.laboratory.findUnique({ where: { code: 'CL-002' } });

  if (computerLab) {
    await prisma.user.update({
      where: { email: 'assistant1@example.com' },
      data: { assignedLaboratories: { set: [{ id: computerLab.id }] } },
    });
  }

  if (networkLab) {
    await prisma.user.update({
      where: { email: 'assistant2@example.com' },
      data: { assignedLaboratories: { set: [{ id: networkLab.id }] } },
    });
  }

  if (computerLab) {
    const equipment = [
      { assetNumber: 'COMP-001', equipmentType: EquipmentType.COMPUTER, name: 'Computer 001', laboratoryId: computerLab.id, status: EquipmentStatus.FUNCTIONAL, condition: EquipmentCondition.GOOD, notes: 'Working' },
      { assetNumber: 'COMP-002', equipmentType: EquipmentType.COMPUTER, name: 'Computer 002', laboratoryId: computerLab.id, status: EquipmentStatus.FUNCTIONAL, condition: EquipmentCondition.GOOD, notes: 'Working' },
      { assetNumber: 'MOUSE-001', equipmentType: EquipmentType.MOUSE, name: 'Mouse 001', laboratoryId: computerLab.id, status: EquipmentStatus.FUNCTIONAL, condition: EquipmentCondition.GOOD, notes: 'Working' },
      { assetNumber: 'MOUSE-002', equipmentType: EquipmentType.MOUSE, name: 'Mouse 002', laboratoryId: computerLab.id, status: EquipmentStatus.MISSING, condition: EquipmentCondition.POOR, notes: 'Missing from station' },
      { assetNumber: 'ADP-001', equipmentType: EquipmentType.ADAPTER, name: 'Adapter 001', laboratoryId: computerLab.id, status: EquipmentStatus.DAMAGED, condition: EquipmentCondition.POOR, notes: 'Cable damaged' },
    ];

    for (const item of equipment) {
      await prisma.equipment.upsert({
        where: { assetNumber: item.assetNumber },
        update: {},
        create: item,
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
