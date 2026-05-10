import { expect, test, vi, beforeEach, describe } from 'vitest';
import { deletePeriodAction } from '@/actions/evaluation-periods';
import { prisma as originalPrisma } from '@/lib/prisma';
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe('Evaluation Periods Action', () => {
  beforeEach(() => {
    // Eksekusi callback di dalam prisma.$transaction menggunakan mock prisma
    prisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma);
      }
      // Jika menggunakan format array (sequential), kembalikan array kosong (tidak digunakan di logic ini)
      return [];
    });
  });

  test('berhasil menghapus periode jika tidak ada statistik terkait', async () => {
    // 1. Setup mock: count mengembalikan 0 (tidak ada statistik)
    prisma.statistic.count.mockResolvedValue(0);
    prisma.evaluationPeriod.findUnique.mockResolvedValue({ id: 'test-id', name: 'Periode Test', startDate: new Date(), endDate: new Date(), isActive: false, createdAt: new Date() });
    
    // 2. Eksekusi fungsi
    await deletePeriodAction('test-period-id');
    
    // 3. Verifikasi: fungsi delete dipanggil
    expect(prisma.evaluationPeriod.delete).toHaveBeenCalledWith({
      where: { id: 'test-period-id' },
    });
    
    // Verifikasi: audit log dipanggil
    expect(prisma.auditlog.create).toHaveBeenCalled();
  });

  test('gagal menghapus periode jika sudah ada nilai (statistik) terkait', async () => {
    // 1. Setup mock: count mengembalikan 5 (ada statistik yang menyangkut)
    prisma.statistic.count.mockResolvedValue(5);
    
    // 2. Eksekusi fungsi dan harapkan error
    await expect(deletePeriodAction('test-period-id')).rejects.toThrow(
      'Periode ini sudah memiliki 5 data nilai. Hapus data nilai terlebih dahulu.'
    );
    
    // 3. Verifikasi: fungsi delete TIDAK boleh dipanggil
    expect(prisma.evaluationPeriod.delete).not.toHaveBeenCalled();
  });
});
