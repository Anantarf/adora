import { vi } from 'vitest';

// Mock Next.js Cache (revalidatePath)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Server Auth (requireAdmin)
vi.mock('@/lib/server-auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: 'test-admin-id', role: 'ADMIN' },
  }),
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', role: 'PARENT' },
  }),
  requireSessionRole: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', role: 'ADMIN' },
  }),
  requireActiveUser: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', role: 'ADMIN' },
  }),
}));

// Mock module prisma to use our __mocks__/prisma.ts
vi.mock('@/lib/prisma');
