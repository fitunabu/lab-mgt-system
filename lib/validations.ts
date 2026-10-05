import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const teacherSignupSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  department: z.string().trim().min(2, 'Department is required.'),
  phone: z.string().trim().min(1, 'Phone number is required.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const technicalAssistantSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().optional(),
  assignedLaboratoryIds: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const requestSchema = z.object({
  laboratoryId: z.string().min(1, 'Select a laboratory.'),
  reservationDate: z.string().min(1, 'Select a date.'),
  startTime: z.string().min(1, 'Select a start time.'),
  endTime: z.string().min(1, 'Select an end time.'),
  course: z.string().min(2, 'Course is required.'),
  studentCount: z.coerce.number().min(1, 'Student count must be greater than zero.'),
  purpose: z.string().min(5, 'Purpose is required.'),
});

export const approvalSchema = z.object({
  requestId: z.string().min(1),
  rejectionReason: z.string().optional(),
});

export const equipmentSchema = z.object({
  equipmentType: z.string().min(1),
  assetNumber: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  laboratoryId: z.string().min(1),
  purchaseDate: z.string().optional(),
  status: z.string().min(1),
  condition: z.string().min(1),
  notes: z.string().optional(),
});

export const inspectionSchema = z.object({
  equipmentId: z.string().min(1),
  internetConnected: z.enum(['true', 'false']),
  monitorFunctional: z.enum(['true', 'false']),
  mouseFunctional: z.enum(['true', 'false']),
  powerCableFunctional: z.enum(['true', 'false']),
  wallOutletFunctional: z.enum(['true', 'false']),
  osFunctional: z.enum(['true', 'false']),
  notes: z.string().optional(),
});
