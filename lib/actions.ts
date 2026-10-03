'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requestSchema, technicalAssistantSchema } from '@/lib/validations';

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAtTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours - 3, minutes));
}

function isBeforeDueDate(request: { reservationDate: Date }) {
  return Date.now() < request.reservationDate.getTime();
}

function getDateList(startDateText: string, endDateText: string, recurrence: 'once' | 'daily' | 'weekly' | 'monthly') {
  const start = new Date(`${startDateText}T00:00:00.000Z`);
  const end = new Date(`${endDateText}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));

    if (recurrence === 'once') {
      break;
    }

    if (recurrence === 'daily') {
      current.setUTCDate(current.getUTCDate() + 1);
    } else if (recurrence === 'weekly') {
      current.setUTCDate(current.getUTCDate() + 7);
    } else if (recurrence === 'monthly') {
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  }

  return dates;
}

export async function createLaboratoryRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only teachers can request laboratories.');
  }

  const payload = {
    laboratoryId: formData.get('laboratoryId')?.toString() ?? '',
    reservationDate: formData.get('reservationDate')?.toString() ?? '',
    startDate: formData.get('startDate')?.toString() ?? formData.get('reservationDate')?.toString() ?? '',
    endDate: formData.get('endDate')?.toString() ?? formData.get('reservationDate')?.toString() ?? '',
    recurrence: (formData.get('recurrence')?.toString() ?? 'once') as 'once' | 'daily' | 'weekly' | 'monthly',
    startTime: formData.get('startTime')?.toString() ?? '',
    endTime: formData.get('endTime')?.toString() ?? '',
    course: formData.get('course')?.toString() ?? '',
    studentCount: formData.get('studentCount')?.toString() ?? '0',
    purpose: formData.get('purpose')?.toString() ?? '',
  };

  const fallbackReservationDate = payload.reservationDate || payload.startDate || payload.endDate;
  if (!fallbackReservationDate) {
    throw new Error('Select a date.');
  }

  const times = formData.getAll('timeSlotStart');
  const ends = formData.getAll('timeSlotEnd');

  const slots = times.length
    ? times
        .map((value, index) => ({
          startTime: value.toString(),
          endTime: ends[index]?.toString() ?? '',
        }))
        .filter((slot) => slot.startTime && slot.endTime)
    : payload.startTime && payload.endTime
      ? [{ startTime: payload.startTime, endTime: payload.endTime }]
      : [];

  if (slots.length === 0) {
    throw new Error('Select at least one time slot.');
  }

  const parsed = requestSchema.safeParse({
    ...payload,
    reservationDate: fallbackReservationDate,
    startTime: slots[0].startTime,
    endTime: slots[0].endTime,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid laboratory request.');
  }

  const lab = await prisma.laboratory.findUnique({ where: { id: parsed.data.laboratoryId } });
  if (!lab || lab.status === 'INACTIVE') {
    throw new Error('This laboratory is currently unavailable.');
  }

  const startDateText = payload.startDate || payload.reservationDate;
  const endDateText = payload.endDate || payload.reservationDate;
  const dates = getDateList(startDateText, endDateText, payload.recurrence);

  if (dates.length === 0) {
    throw new Error('Select a valid date range.');
  }

  const allRequests: Array<{ reservationDate: Date; startTime: string; endTime: string }> = [];

  for (const date of dates) {
    for (const slot of slots) {
      const startMinutes = minutesFromTime(slot.startTime);
      const endMinutes = minutesFromTime(slot.endTime);

      if (endMinutes <= startMinutes) {
        throw new Error('Each time slot must end after it starts.');
      }

      const requestedStart = dateAtTime(date, slot.startTime);
      const requestedEnd = dateAtTime(date, slot.endTime);

      const overlappingApprovedRequests = await prisma.laboratoryRequest.findMany({
        where: {
          laboratoryId: parsed.data.laboratoryId,
          status: 'APPROVED',
          teacherId: { not: session.user.id },
          reservationDate: new Date(date.toISOString().slice(0, 10)),
        },
        include: { teacher: true },
      });

      const conflict = overlappingApprovedRequests.find((existing) => {
        const existingReservation = new Date(existing.reservationDate);
        const existingStart = dateAtTime(existingReservation, existing.startTime);
        const existingEnd = dateAtTime(existingReservation, existing.endTime);
        return requestedStart < existingEnd && requestedEnd > existingStart;
      });

      if (conflict) {
        const reservedBy = conflict.teacher?.name ?? 'another teacher';
        throw new Error(`This laboratory is already reserved by ${reservedBy} on ${date.toISOString().slice(0, 10)} at ${slot.startTime}.`);
      }

      allRequests.push({
        reservationDate: new Date(date.toISOString().slice(0, 10)),
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
  }

  const createdRequests = [] as any[];
  const startDateValue = new Date(`${startDateText}T00:00:00.000Z`);
  const endDateValue = new Date(`${endDateText}T00:00:00.000Z`);

  for (const item of allRequests) {
    const request = await prisma.laboratoryRequest.create({
      data: {
        teacherId: session.user.id,
        laboratoryId: parsed.data.laboratoryId,
        reservationDate: item.reservationDate,
        startDate: startDateValue,
        endDate: endDateValue,
        recurrencePattern: payload.recurrence,
        startTime: item.startTime,
        endTime: item.endTime,
        course: parsed.data.course,
        studentCount: parsed.data.studentCount,
        purpose: parsed.data.purpose,
        status: 'PENDING',
      },
    });

    createdRequests.push(request);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REQUEST_CREATED',
        entity: 'LaboratoryRequest',
        entityId: request.id,
        description: `Teacher ${session.user.name} requested a laboratory reservation for ${item.reservationDate.toISOString().slice(0, 10)} from ${item.startTime} to ${item.endTime}.`,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: 'Request Created',
      message: `Your laboratory request for ${createdRequests.length} time slot(s) was submitted and is awaiting review.`,
      type: 'INFO',
    },
  });

  revalidatePath('/requests');
  redirect('/requests');
}

export async function approveRequest(requestId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TECHNICAL_ASSISTANT') {
    throw new Error('You are not authorized to approve this request.');
  }

  const request = await prisma.laboratoryRequest.findUnique({
    where: { id: requestId },
    include: { teacher: true, laboratory: true },
  });

  if (!request) throw new Error('Request not found.');
  if (request.status !== 'PENDING') throw new Error('This request is not pending approval.');
  if (!isBeforeDueDate(request)) throw new Error('You can only approve a request before its due date.');

  const approved = await prisma.$transaction(async (tx) => {
    const updated = await tx.laboratoryRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    await tx.laboratory.update({
      where: { id: request.laboratoryId },
      data: { status: 'RESERVED' },
    });

    const reservationDate = new Date(request.reservationDate);
    const startDate = dateAtTime(reservationDate, request.startTime);
    const endDate = dateAtTime(reservationDate, request.endTime);

    await tx.laboratorySession.create({
      data: {
        requestId: request.id,
        teacherId: request.teacherId,
        laboratoryId: request.laboratoryId,
        scheduledStart: startDate,
        scheduledEnd: endDate,
        status: 'SCHEDULED',
      },
    });

    await tx.notification.create({
      data: {
        userId: request.teacherId,
        title: 'Request Approved',
        message: 'Your laboratory request has been approved.',
        type: 'SUCCESS',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REQUEST_APPROVED',
        entity: 'LaboratoryRequest',
        entityId: request.id,
        description: `Technical assistant approved request for ${request.laboratory.name}.`,
      },
    });

    return updated;
  });

  revalidatePath('/requests');
  revalidatePath('/schedule');
  return approved;
}

export async function rejectRequest(requestId: string, reason: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TECHNICAL_ASSISTANT') {
    throw new Error('You are not authorized to reject this request.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('Request not found.');
  if (request.status !== 'PENDING') throw new Error('This request is not pending review.');
  if (!isBeforeDueDate(request)) throw new Error('You can only reject a request before its due date.');
  if (!reason?.trim()) throw new Error('A rejection reason is required.');

  const updated = await prisma.laboratoryRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: request.teacherId,
      title: 'Request Rejected',
      message: `Your laboratory request was rejected: ${reason}`,
      type: 'WARNING',
    },
  });

  revalidatePath('/requests');
  revalidatePath('/schedule');
  return updated;
}

export async function requestTermination(requestId: string, reason: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only teachers can terminate approved requests.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('Request not found.');
  if (request.teacherId !== session.user.id) throw new Error('You cannot terminate another teacher\'s request.');
  if (request.status !== 'APPROVED') throw new Error('Only approved requests can be terminated.');

  if (!isBeforeDueDate(request)) {
    throw new Error('You can only terminate a request before the class end date.');
  }

  if (!reason.trim()) {
    throw new Error('A termination reason is required.');
  }

  const updated = await prisma.laboratoryRequest.update({
    where: { id: requestId },
    data: {
      status: 'TERMINATION_REQUESTED',
      rejectionReason: reason,
      approvedBy: null,
      approvedAt: null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: request.teacherId,
      title: 'Termination Requested',
      message: `Your termination request for ${request.laboratoryId} is pending assistant approval.`,
      type: 'WARNING',
    },
  });

  const lab = await prisma.laboratory.findUnique({ where: { id: request.laboratoryId }, select: { id: true, assignedUsers: { select: { id: true } } } });
  if (lab) {
    const assistantIds = lab.assignedUsers.map((user) => user.id);
    for (const assistantId of assistantIds) {
      await prisma.notification.create({
        data: {
          userId: assistantId,
          title: 'Lab termination request',
          message: `${session.user.name} requested to terminate an approved reservation for ${request.course}. Reason: ${reason}`,
          type: 'INFO',
        },
      });
    }
  }

  revalidatePath('/requests');
  revalidatePath('/schedule');
  return updated;
}

export async function approveTerminationRequest(requestId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TECHNICAL_ASSISTANT') {
    throw new Error('You are not authorized to approve this termination request.');
  }

  const request = await prisma.laboratoryRequest.findUnique({
    where: { id: requestId },
    include: { teacher: true, laboratory: true },
  });

  if (!request) throw new Error('Request not found.');
  if (request.status !== 'TERMINATION_REQUESTED') throw new Error('This request is not waiting for termination approval.');

  const assistant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { assignedLaboratoryId: true },
  });

  if (assistant?.assignedLaboratoryId && request.laboratoryId !== assistant.assignedLaboratoryId) {
    throw new Error('You can only approve termination requests for your assigned laboratory.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.laboratoryRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    const sessionRecord = await tx.laboratorySession.findUnique({ where: { requestId } });
    if (sessionRecord) {
      await tx.laboratorySession.update({
        where: { id: sessionRecord.id },
        data: { status: 'CANCELLED' },
      });
    }

    await tx.laboratory.update({
      where: { id: request.laboratoryId },
      data: { status: 'AVAILABLE' },
    });

    await tx.notification.create({
      data: {
        userId: request.teacherId,
        title: 'Termination Approved',
        message: 'Your request termination was approved and the laboratory slot has been released for others.',
        type: 'SUCCESS',
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TERMINATION_APPROVED',
        entity: 'LaboratoryRequest',
        entityId: request.id,
        description: `Technical assistant approved termination for ${request.laboratory.name}.`,
      },
    });
  });

  revalidatePath('/requests');
  revalidatePath('/schedule');
}

export async function updateLaboratoryRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only teachers can update pending requests.');
  }

  const requestId = formData.get('id')?.toString() ?? '';
  if (!requestId) {
    throw new Error('Request id is required.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('Request not found.');
  if (request.teacherId !== session.user.id) throw new Error('You cannot edit another teacher\'s request.');
  if (request.status !== 'PENDING') throw new Error('Only pending requests can be updated.');
  if (!isBeforeDueDate(request)) throw new Error('You can only edit a request before its due date.');

  const startDate = formData.get('startDate')?.toString() ?? formData.get('reservationDate')?.toString() ?? '';
  const endDate = formData.get('endDate')?.toString() ?? formData.get('reservationDate')?.toString() ?? startDate;
  const recurrence = (formData.get('recurrence')?.toString() ?? 'once') as 'once' | 'daily' | 'weekly' | 'monthly';
  const timeStarts = formData.getAll('timeSlotStart').map((value) => value.toString());
  const timeEnds = formData.getAll('timeSlotEnd').map((value) => value.toString());
  const slots = timeStarts
    .map((startTime, index) => ({ startTime, endTime: timeEnds[index] ?? '' }))
    .filter((slot) => slot.startTime && slot.endTime);

  if (slots.length === 0) {
    throw new Error('Select at least one time slot.');
  }

  const payload = {
    laboratoryId: formData.get('laboratoryId')?.toString() ?? request.laboratoryId,
    reservationDate: formData.get('reservationDate')?.toString() ?? startDate,
    startDate,
    endDate,
    recurrence,
    startTime: slots[0].startTime,
    endTime: slots[0].endTime,
    course: formData.get('course')?.toString() ?? '',
    studentCount: Number(formData.get('studentCount')?.toString() ?? '0'),
    purpose: formData.get('purpose')?.toString() ?? '',
  };

  const parsed = requestSchema.safeParse({
    laboratoryId: payload.laboratoryId,
    reservationDate: payload.reservationDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    course: payload.course,
    studentCount: payload.studentCount,
    purpose: payload.purpose,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid request update.');
  }

  if (minutesFromTime(payload.endTime) <= minutesFromTime(payload.startTime)) {
    throw new Error('The end time must be later than the start time.');
  }

  const updated = await prisma.laboratoryRequest.update({
    where: { id: requestId },
    data: {
      laboratoryId: payload.laboratoryId,
      reservationDate: new Date(`${payload.reservationDate}T00:00:00.000Z`),
      startDate: payload.startDate ? new Date(`${payload.startDate}T00:00:00.000Z`) : null,
      endDate: payload.endDate ? new Date(`${payload.endDate}T00:00:00.000Z`) : null,
      recurrencePattern: payload.recurrence,
      startTime: payload.startTime,
      endTime: payload.endTime,
      course: payload.course,
      studentCount: payload.studentCount,
      purpose: payload.purpose,
      rejectionReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REQUEST_UPDATED',
      entity: 'LaboratoryRequest',
      entityId: updated.id,
      description: `Teacher updated a pending laboratory request.`,
    },
  });

  revalidatePath('/requests');
  return updated;
}

export async function deleteLaboratoryRequest(requestId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only teachers can delete pending requests.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('Request not found.');
  if (request.teacherId !== session.user.id) throw new Error('You cannot delete another teacher\'s request.');
  if (request.status !== 'PENDING') throw new Error('Only pending requests can be deleted.');
  if (!isBeforeDueDate(request)) throw new Error('You can only delete a request before its due date.');

  await prisma.laboratoryRequest.delete({ where: { id: requestId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REQUEST_DELETED',
      entity: 'LaboratoryRequest',
      entityId: requestId,
      description: `Teacher deleted a pending laboratory request.`,
    },
  });

  revalidatePath('/requests');
}

export async function startSession(requestId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only the assigned teacher can start this session.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request || request.teacherId !== session.user.id) {
    throw new Error('Only the assigned teacher can start this class.');
  }

  const currentSession = await prisma.laboratorySession.findUnique({ where: { requestId } });
  if (!currentSession) throw new Error('No active session exists for this request.');
  if (request.status !== 'APPROVED') throw new Error('This request has not been approved.');

  await prisma.laboratorySession.update({
    where: { id: currentSession.id },
    data: {
      actualStart: new Date(),
      status: 'ACTIVE',
    },
  });

  await prisma.laboratory.update({
    where: { id: request.laboratoryId },
    data: { status: 'OCCUPIED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'SESSION_STARTED',
      entity: 'LaboratorySession',
      entityId: currentSession.id,
      description: `Teacher started a laboratory session.`,
    },
  });

  revalidatePath('/dashboard');
}

export async function finishSession(requestId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Only the assigned teacher can finish this session.');
  }

  const request = await prisma.laboratoryRequest.findUnique({ where: { id: requestId } });
  if (!request || request.teacherId !== session.user.id) {
    throw new Error('Only the assigned teacher can finish this class.');
  }

  const currentSession = await prisma.laboratorySession.findUnique({ where: { requestId } });
  if (!currentSession) throw new Error('Session not found.');

  await prisma.laboratorySession.update({
    where: { id: currentSession.id },
    data: { actualEnd: new Date(), status: 'INSPECTION' },
  });

  await prisma.laboratory.update({
    where: { id: request.laboratoryId },
    data: { status: 'INSPECTION' },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'SESSION_FINISHED',
      entity: 'LaboratorySession',
      entityId: currentSession.id,
      description: `Teacher finished a laboratory session and it entered inspection.`,
    },
  });

  revalidatePath('/dashboard');
}

export async function completeInspection(sessionId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'TECHNICAL_ASSISTANT') {
    throw new Error('Only technical assistants can complete inspections.');
  }

  const labSession = await prisma.laboratorySession.findUnique({ where: { id: sessionId } });
  if (!labSession) throw new Error('Session not found.');

  await prisma.laboratorySession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' },
  });

  await prisma.laboratoryRequest.update({
    where: { id: labSession.requestId },
    data: { status: 'COMPLETED' },
  });

  await prisma.laboratory.update({
    where: { id: labSession.laboratoryId },
    data: { status: 'AVAILABLE' },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'INSPECTION_COMPLETED',
      entity: 'EquipmentInspection',
      entityId: sessionId,
      description: 'Technical assistant completed the post-class inspection and released the laboratory.',
    },
  });

  revalidatePath('/inspections');
}

export async function createLaboratory(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can create laboratories.');
  }

  const payload = {
    name: formData.get('name')?.toString() ?? '',
    code: formData.get('code')?.toString() ?? '',
    location: formData.get('location')?.toString() ?? '',
    capacity: Number(formData.get('capacity') ?? 0),
    status: formData.get('status')?.toString() ?? 'AVAILABLE',
    description: formData.get('description')?.toString() ?? '',
  };

  if (!payload.name.trim() || !payload.code.trim() || !payload.location.trim()) {
    throw new Error('Name, code, and location are required.');
  }

  if (payload.capacity <= 0) {
    throw new Error('Capacity must be greater than zero.');
  }

  const existing = await prisma.laboratory.findUnique({ where: { code: payload.code.trim() } });
  if (existing) {
    throw new Error('A laboratory with that code already exists.');
  }

  const lab = await prisma.laboratory.create({
    data: {
      name: payload.name.trim(),
      code: payload.code.trim(),
      location: payload.location.trim(),
      capacity: payload.capacity,
      status: payload.status as any,
      description: payload.description.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'LABORATORY_CREATED',
      entity: 'Laboratory',
      entityId: lab.id,
      description: `Admin created laboratory ${lab.name}.`,
    },
  });

  revalidatePath('/laboratories');
  redirect('/laboratories');
}

export async function updateLaboratory(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can update laboratories.');
  }

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Laboratory not found.');

  const payload = {
    name: formData.get('name')?.toString() ?? '',
    code: formData.get('code')?.toString() ?? '',
    location: formData.get('location')?.toString() ?? '',
    capacity: Number(formData.get('capacity') ?? 0),
    status: formData.get('status')?.toString() ?? 'AVAILABLE',
    description: formData.get('description')?.toString() ?? '',
  };

  if (!payload.name.trim() || !payload.code.trim() || !payload.location.trim()) {
    throw new Error('Name, code, and location are required.');
  }

  if (payload.capacity <= 0) {
    throw new Error('Capacity must be greater than zero.');
  }

  const existing = await prisma.laboratory.findUnique({ where: { id } });
  if (!existing) throw new Error('Laboratory not found.');

  if (existing.code !== payload.code.trim()) {
    const codeTaken = await prisma.laboratory.findUnique({ where: { code: payload.code.trim() } });
    if (codeTaken) throw new Error('Another laboratory already uses that code.');
  }

  const updated = await prisma.laboratory.update({
    where: { id },
    data: {
      name: payload.name.trim(),
      code: payload.code.trim(),
      location: payload.location.trim(),
      capacity: payload.capacity,
      status: payload.status as any,
      description: payload.description.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'LABORATORY_UPDATED',
      entity: 'Laboratory',
      entityId: updated.id,
      description: `Admin updated laboratory ${updated.name}.`,
    },
  });

  revalidatePath('/laboratories');
  redirect('/laboratories');
}

export async function deleteLaboratory(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can delete laboratories.');
  }

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Laboratory not found.');

  const laboratory = await prisma.laboratory.findUnique({ where: { id } });
  if (!laboratory) throw new Error('Laboratory not found.');

  await prisma.laboratory.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'LABORATORY_DELETED',
      entity: 'Laboratory',
      entityId: id,
      description: `Admin deleted laboratory ${laboratory.name}.`,
    },
  });

  revalidatePath('/laboratories');
  redirect('/laboratories');
}

export async function createTechnicalAssistant(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can add technical assistants.');
  }

  const parsed = technicalAssistantSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
    phone: formData.get('phone')?.toString() ?? '',
    assignedLaboratoryId: formData.get('assignedLaboratoryId')?.toString() ?? '',
    status: formData.get('status')?.toString() ?? 'ACTIVE',
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid assistant details.');

  const password = formData.get('password')?.toString() ?? '';
  const passwordResult = z.string().min(8, 'Password must be at least 8 characters.').safeParse(password);
  if (!passwordResult.success) throw new Error(passwordResult.error.issues[0]?.message ?? 'Invalid password.');

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) throw new Error('A user with that email already exists.');

  const assignedLaboratoryId = parsed.data.assignedLaboratoryId || null;
  if (assignedLaboratoryId) {
    const laboratory = await prisma.laboratory.findUnique({ where: { id: assignedLaboratoryId } });
    if (!laboratory) throw new Error('Selected laboratory was not found.');
  }

  const assistant = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'TECHNICAL_ASSISTANT',
      status: parsed.data.status,
      assignedLaboratoryId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'TECHNICAL_ASSISTANT_CREATED',
      entity: 'User',
      entityId: assistant.id,
      description: `Admin created technical assistant ${assistant.name}.`,
    },
  });

  revalidatePath('/users');
  revalidatePath('/dashboard/admin');
  return { id: assistant.id };
}

export async function updateTechnicalAssistant(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can update technical assistants.');
  }

  const id = formData.get('id')?.toString() ?? '';
  if (!id) throw new Error('Assistant not found.');

  const assistant = await prisma.user.findUnique({ where: { id } });
  if (!assistant || assistant.role !== 'TECHNICAL_ASSISTANT') throw new Error('Technical assistant not found.');

  const parsed = technicalAssistantSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
    phone: formData.get('phone')?.toString() ?? '',
    assignedLaboratoryId: formData.get('assignedLaboratoryId')?.toString() ?? '',
    status: formData.get('status')?.toString() ?? 'ACTIVE',
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid assistant details.');

  const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail && existingEmail.id !== id) throw new Error('A user with that email already exists.');

  const assignedLaboratoryId = parsed.data.assignedLaboratoryId || null;
  if (assignedLaboratoryId) {
    const laboratory = await prisma.laboratory.findUnique({ where: { id: assignedLaboratoryId } });
    if (!laboratory) throw new Error('Selected laboratory was not found.');
  }

  const password = formData.get('password')?.toString() ?? '';
  const passwordHash = password
    ? await bcrypt.hash(z.string().min(8, 'Password must be at least 8 characters.').parse(password), 10)
    : undefined;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
      assignedLaboratoryId,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'TECHNICAL_ASSISTANT_UPDATED',
      entity: 'User',
      entityId: updated.id,
      description: `Admin updated technical assistant ${updated.name}.`,
    },
  });

  revalidatePath('/users');
  revalidatePath('/dashboard/admin');
  return { id: updated.id };
}

export async function assignAssistantLaboratory(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Only administrators can assign laboratories to technical assistants.');
  }

  const assistantId = formData.get('assistantId')?.toString();
  const laboratoryId = formData.get('laboratoryId')?.toString() ?? '';

  if (!assistantId) {
    throw new Error('Assistant not found.');
  }

  const assistant = await prisma.user.findUnique({
    where: { id: assistantId },
    select: { id: true, role: true },
  });

  if (!assistant || assistant.role !== 'TECHNICAL_ASSISTANT') {
    throw new Error('Only technical assistants can be assigned a laboratory.');
  }

  if (laboratoryId) {
    const lab = await prisma.laboratory.findUnique({ where: { id: laboratoryId } });
    if (!lab) throw new Error('Selected laboratory was not found.');
  }

  await prisma.user.update({
    where: { id: assistantId },
    data: { assignedLaboratoryId: laboratoryId || null },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ASSISTANT_LAB_ASSIGNMENT_UPDATED',
      entity: 'User',
      entityId: assistantId,
      description: laboratoryId
        ? `Admin assigned technical assistant to laboratory ${laboratoryId}.`
        : 'Admin removed the assigned laboratory from a technical assistant.',
    },
  });

  revalidatePath('/dashboard/admin');
  redirect('/dashboard/admin');
}

export async function createEquipment(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'TECHNICAL_ASSISTANT' && session.user.role !== 'ADMIN')) {
    throw new Error('Only technical assistants and administrators can add equipment.');
  }

  if (session.user.role === 'TECHNICAL_ASSISTANT') {
    const assignedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { assignedLaboratoryId: true },
    });

    if (!assignedUser?.assignedLaboratoryId) {
      throw new Error('You must be assigned to a laboratory before adding equipment.');
    }

    const requestedLabId = formData.get('laboratoryId')?.toString() ?? '';
    if (requestedLabId !== assignedUser.assignedLaboratoryId) {
      throw new Error('Technical assistants can only register equipment for their assigned laboratory.');
    }
  }

  const quantityValue = Number.parseInt(formData.get('quantity')?.toString() ?? '1', 10);
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;

  const payload = {
    assetNumber: formData.get('assetNumber')?.toString() ?? '',
    equipmentType: formData.get('equipmentType')?.toString() ?? '',
    name: formData.get('name')?.toString() ?? '',
    brand: formData.get('brand')?.toString() ?? '',
    model: formData.get('model')?.toString() ?? '',
    serialNumber: formData.get('serialNumber')?.toString() ?? '',
    hardDiskSize: formData.get('hardDiskSize')?.toString() ?? '',
    ramSize: formData.get('ramSize')?.toString() ?? '',
    installedOS: formData.get('installedOS')?.toString() ?? '',
    laboratoryId: formData.get('laboratoryId')?.toString() ?? '',
    status: formData.get('status')?.toString() ?? 'FUNCTIONAL',
    condition: formData.get('condition')?.toString() ?? 'GOOD',
    purchaseDate: formData.get('purchaseDate')?.toString() ?? '',
    notes: formData.get('notes')?.toString() ?? '',
  };

  if (!payload.assetNumber.trim() || !payload.equipmentType || !payload.name.trim() || !payload.laboratoryId) {
    throw new Error('Asset number, type, name, and laboratory are required.');
  }

  const lab = await prisma.laboratory.findUnique({ where: { id: payload.laboratoryId } });
  if (!lab) throw new Error('Selected laboratory was not found.');

  const buildSequenceValue = (baseValue: string, index: number) => {
    if (index === 0) return baseValue;

    const match = baseValue.match(/^(.*?)(\d+)(\D*)$/);
    if (match) {
      const prefix = match[1];
      const numberPart = match[2];
      const suffix = match[3] ?? '';
      const nextNumber = Number.parseInt(numberPart, 10) + index;
      return `${prefix}${String(nextNumber).padStart(numberPart.length, '0')}${suffix}`;
    }

    return `${baseValue}-${index + 1}`;
  };

  const createdEquipment = [] as Array<{ id: string; name: string }>;

  for (let index = 0; index < quantity; index += 1) {
    const itemAssetNumber = buildSequenceValue(payload.assetNumber.trim(), index);
    const itemSerialNumber = payload.serialNumber?.trim() ? buildSequenceValue(payload.serialNumber.trim(), index) : null;

    const assetExists = await prisma.equipment.findUnique({ where: { assetNumber: itemAssetNumber } });
    if (assetExists) throw new Error(`An equipment item with asset number ${itemAssetNumber} already exists.`);

    if (itemSerialNumber) {
      const serialExists = await prisma.equipment.findUnique({ where: { serialNumber: itemSerialNumber } });
      if (serialExists) throw new Error(`An equipment item with serial number ${itemSerialNumber} already exists.`);
    }

    const isComputer = payload.equipmentType === 'COMPUTER';

    const equipment = await prisma.equipment.create({
      data: {
        assetNumber: itemAssetNumber,
        equipmentType: payload.equipmentType as any,
        name: payload.name.trim(),
        brand: payload.brand.trim() || null,
        model: payload.model.trim() || null,
        serialNumber: itemSerialNumber,
        hardDiskSize: isComputer ? payload.hardDiskSize.trim() || null : null,
        ramSize: isComputer ? payload.ramSize.trim() || null : null,
        installedOS: isComputer ? payload.installedOS.trim() || null : null,
        laboratoryId: payload.laboratoryId,
        status: payload.status as any,
        condition: payload.condition as any,
        purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : null,
        notes: payload.notes.trim() || null,
      },
    });

    createdEquipment.push({ id: equipment.id, name: equipment.name });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EQUIPMENT_CREATED',
        entity: 'Equipment',
        entityId: equipment.id,
        description: `Equipment ${equipment.name} was added to ${lab.name}.`,
      },
    });
  }

  revalidatePath('/equipment');
}

export async function updateEquipment(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'TECHNICAL_ASSISTANT' && session.user.role !== 'ADMIN')) {
    throw new Error('Only technical assistants and administrators can edit equipment.');
  }

  if (session.user.role === 'TECHNICAL_ASSISTANT') {
    const assignedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { assignedLaboratoryId: true },
    });

    if (!assignedUser?.assignedLaboratoryId) {
      throw new Error('You must be assigned to a laboratory before editing equipment.');
    }
  }

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Equipment not found.');

  const payload = {
    assetNumber: formData.get('assetNumber')?.toString() ?? '',
    equipmentType: formData.get('equipmentType')?.toString() ?? '',
    name: formData.get('name')?.toString() ?? '',
    brand: formData.get('brand')?.toString() ?? '',
    model: formData.get('model')?.toString() ?? '',
    serialNumber: formData.get('serialNumber')?.toString() ?? '',
    hardDiskSize: formData.get('hardDiskSize')?.toString() ?? '',
    ramSize: formData.get('ramSize')?.toString() ?? '',
    installedOS: formData.get('installedOS')?.toString() ?? '',
    laboratoryId: formData.get('laboratoryId')?.toString() ?? '',
    status: formData.get('status')?.toString() ?? 'FUNCTIONAL',
    condition: formData.get('condition')?.toString() ?? 'GOOD',
    purchaseDate: formData.get('purchaseDate')?.toString() ?? '',
    notes: formData.get('notes')?.toString() ?? '',
  };

  if (!payload.assetNumber.trim() || !payload.equipmentType || !payload.name.trim() || !payload.laboratoryId) {
    throw new Error('Asset number, type, name, and laboratory are required.');
  }

  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) throw new Error('Equipment not found.');

  if (session.user.role === 'TECHNICAL_ASSISTANT') {
    const assignedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { assignedLaboratoryId: true },
    });

    if (!assignedUser?.assignedLaboratoryId) {
      throw new Error('You must be assigned to a laboratory before editing equipment.');
    }

    if (payload.laboratoryId !== assignedUser.assignedLaboratoryId || existing.laboratoryId !== assignedUser.assignedLaboratoryId) {
      throw new Error('Technical assistants can only edit equipment in their assigned laboratory.');
    }
  }

  if (existing.assetNumber !== payload.assetNumber.trim()) {
    const assetExists = await prisma.equipment.findUnique({ where: { assetNumber: payload.assetNumber.trim() } });
    if (assetExists) throw new Error('Another equipment item already uses that asset number.');
  }

  if (existing.serialNumber !== (payload.serialNumber.trim() || null)) {
    if (payload.serialNumber?.trim()) {
      const serialExists = await prisma.equipment.findUnique({ where: { serialNumber: payload.serialNumber.trim() } });
      if (serialExists) throw new Error('Another equipment item already uses that serial number.');
    }
  }

  const isComputer = payload.equipmentType === 'COMPUTER';

  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      assetNumber: payload.assetNumber.trim(),
      equipmentType: payload.equipmentType as any,
      name: payload.name.trim(),
      brand: payload.brand.trim() || null,
      model: payload.model.trim() || null,
      serialNumber: payload.serialNumber.trim() || null,
      hardDiskSize: isComputer ? payload.hardDiskSize.trim() || null : null,
      ramSize: isComputer ? payload.ramSize.trim() || null : null,
      installedOS: isComputer ? payload.installedOS.trim() || null : null,
      laboratoryId: payload.laboratoryId,
      status: payload.status as any,
      condition: payload.condition as any,
      purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : null,
      notes: payload.notes.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'EQUIPMENT_UPDATED',
      entity: 'Equipment',
      entityId: equipment.id,
      description: `Equipment ${equipment.name} was updated.`,
    },
  });

  revalidatePath('/equipment');
}

export async function deleteEquipment(formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'TECHNICAL_ASSISTANT' && session.user.role !== 'ADMIN')) {
    throw new Error('Only technical assistants and administrators can delete equipment.');
  }

  if (session.user.role === 'TECHNICAL_ASSISTANT') {
    const assignedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { assignedLaboratoryId: true },
    });

    if (!assignedUser?.assignedLaboratoryId) {
      throw new Error('You must be assigned to a laboratory before deleting equipment.');
    }
  }

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Equipment not found.');

  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) throw new Error('Equipment not found.');

  if (session.user.role === 'TECHNICAL_ASSISTANT') {
    const assignedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { assignedLaboratoryId: true },
    });

    if (!assignedUser?.assignedLaboratoryId || equipment.laboratoryId !== assignedUser.assignedLaboratoryId) {
      throw new Error('Technical assistants can only delete equipment from their assigned laboratory.');
    }
  }

  await prisma.equipment.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'EQUIPMENT_DELETED',
      entity: 'Equipment',
      entityId: id,
      description: `Equipment ${equipment.name} was deleted.`,
    },
  });

  revalidatePath('/equipment');
}
