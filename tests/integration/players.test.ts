import { expect, test, vi, beforeEach, describe } from 'vitest';
import { addBatchPlayersAction } from '@/actions/players';
import { prisma as originalPrisma } from '@/lib/prisma';
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe('Players Batch Upload Action', () => {
  beforeEach(() => {
    // Eksekusi callback di dalam prisma.$transaction
    prisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      return [];
    });
  });

  test('menggagalkan upload jika ada groupId yang fiktif (tidak ditemukan di DB)', async () => {
    const invalidPayload = [
      {
        name: 'Player 1',
        dateOfBirth: '2010-05-10',
        groupId: 'fake-group-id', // Group ID fiktif
      }
    ];

    // Mock prisma.group.findMany mengembalikan array kosong (artinya grup tidak ditemukan)
    prisma.group.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);

    await expect(addBatchPlayersAction(invalidPayload)).rejects.toThrow(
      'Ada groupId tidak ditemukan: fake-group-id'
    );
  });

  test('berhasil memproses batch, menghapus duplikat internal, dan mencatat audit log', async () => {
    const validPayload = [
      { name: 'Player A', dateOfBirth: '2012-01-01', groupId: 'valid-group-1' },
      { name: 'Player A', dateOfBirth: '2012-01-01', groupId: 'valid-group-1' }, // Duplikat identik
      { name: 'Player B', dateOfBirth: '2013-05-05', groupId: 'valid-group-1' }
    ];

    // Mock Prisma untuk melegitimasi groupId
    prisma.group.findMany.mockResolvedValue([
      { id: 'valid-group-1', name: 'Group 1', createdAt: new Date(), updatedAt: new Date(), description: null, homebaseId: null }
    ]);
    prisma.user.findMany.mockResolvedValue([]);

    // Mock createMany return value
    prisma.player.createMany.mockResolvedValue({ count: 2 }); // 2 pemain karena 1 duplikat dibuang oleh Set

    const result = await addBatchPlayersAction(validPayload);

    // Verifikasi output
    expect(result.submitted).toBe(3); // 3 dikirim
    expect(result.deduped).toBe(2);   // 2 berhasil di filter
    expect(result.count).toBe(2);     // 2 di-insert

    // Verifikasi createMany dipanggil dengan skipDuplicates: true
    expect(prisma.player.createMany).toHaveBeenCalledWith({
      data: expect.any(Array),
      skipDuplicates: true
    });

    // Verifikasi Audit Log dicatat dengan aksi CREATE dan target table player_batch
    expect(prisma.auditlog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CREATE',
        targetTable: 'player_batch',
        recordId: '2', // Count
      })
    });
  });
});
