/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

function now(): Date {
  return new Date();
}

function emptyRows(): any[] {
  return [];
}

function emptyRow(): any | null {
  return null;
}

function toId(value: any): string {
  if (typeof value === "string" && value.trim()) return value;
  return `local_${Date.now().toString(36)}`;
}

/**
 * Frontend-only fallback that keeps existing pages working without Prisma.
 * All read methods return empty values; create methods return a local object.
 */
export const prisma = {
  user: {
    count: async (..._args: any[]) => 0,
    findMany: async (..._args: any[]) => emptyRows(),
    findUnique: async (..._args: any[]) => emptyRow(),
  },
  contactSubmission: {
    count: async (..._args: any[]) => 0,
    findMany: async (..._args: any[]) => emptyRows(),
    findUnique: async (..._args: any[]) => emptyRow(),
    create: async (args?: { data?: Record<string, any> }) => ({
      id: toId(args?.data?.id),
      createdAt: now(),
      ...(args?.data ?? {}),
    }),
  },
  courierBooking: {
    count: async (..._args: any[]) => 0,
    findMany: async (..._args: any[]) => emptyRows(),
    findUnique: async (..._args: any[]) => emptyRow(),
    findFirst: async (..._args: any[]) => emptyRow(),
    groupBy: async (..._args: any[]) => emptyRows(),
    create: async (args?: { data?: Record<string, any> }) => ({
      id: toId(args?.data?.id),
      createdAt: now(),
      ...(args?.data ?? {}),
    }),
  },
};
