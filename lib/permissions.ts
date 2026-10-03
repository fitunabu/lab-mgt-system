import { UserRole } from '@prisma/client';

export type Role = UserRole;

export function isAdmin(role?: string | null) {
  return role === UserRole.ADMIN;
}

export function isTechnicalAssistant(role?: string | null) {
  return role === UserRole.TECHNICAL_ASSISTANT;
}

export function isTeacher(role?: string | null) {
  return role === UserRole.TEACHER;
}
