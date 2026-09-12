import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportsService } from './imports.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ImportType } from './dto/import.dto.js';

describe('ImportsService', () => {
  let service: ImportsService;

  const mockPrisma = {
    import: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    importRow: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    importSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listImports', () => {
    it('should return paginated imports', async () => {
      const mockImports = [
        { id: '1', type: 'csv', status: 'pending', familyId: 'f1' },
      ];
      mockPrisma.import.findMany.mockResolvedValue(mockImports);
      mockPrisma.import.count.mockResolvedValue(1);

      const result = await service.listImports('f1', {});

      expect(result.data).toEqual(mockImports);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getImport', () => {
    it('should return an import by ID', async () => {
      const mockImport = {
        id: '1',
        familyId: 'f1',
        type: 'csv',
        status: 'pending',
        rowsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.import.findFirst.mockResolvedValue(mockImport);

      const result = await service.getImport('1', 'f1');

      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if import not found', async () => {
      mockPrisma.import.findFirst.mockResolvedValue(null);

      await expect(service.getImport('1', 'f1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createImport', () => {
    it('should create a new import', async () => {
      const mockImport = {
        id: '1',
        familyId: 'f1',
        type: 'csv',
        status: 'pending',
        rowsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.import.create.mockResolvedValue(mockImport);

      const result = await service.createImport('f1', { type: ImportType.CSV });

      expect(result.type).toBe('csv');
      expect(result.status).toBe('pending');
    });
  });

  describe('configureImport', () => {
    it('should configure import column mappings', async () => {
      const mockImport = {
        id: '1',
        familyId: 'f1',
        status: 'pending',
      };
      mockPrisma.import.findFirst.mockResolvedValue(mockImport);
      mockPrisma.import.update.mockResolvedValue({
        ...mockImport,
        dateColLabel: 'Date',
        amountColLabel: 'Amount',
      });

      const result = await service.configureImport('1', 'f1', {
        dateColLabel: 'Date',
        amountColLabel: 'Amount',
      });

      expect(result.dateColLabel).toBe('Date');
    });

    it('should throw if import not found', async () => {
      mockPrisma.import.findFirst.mockResolvedValue(null);

      await expect(
        service.configureImport('1', 'f1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publishImport', () => {
    it('should publish an import', async () => {
      const mockImport = {
        id: '1',
        familyId: 'f1',
        status: 'pending',
      };
      mockPrisma.import.findFirst.mockResolvedValue(mockImport);
      mockPrisma.import.update.mockResolvedValue({
        ...mockImport,
        status: 'importing',
      });

      const result = await service.publishImport('1', 'f1');

      expect(result.status).toBe('importing');
    });

    it('should throw if import is not pending', async () => {
      mockPrisma.import.findFirst.mockResolvedValue({
        id: '1',
        familyId: 'f1',
        status: 'complete',
      });

      await expect(service.publishImport('1', 'f1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('previewContent', () => {
    it('should parse CSV content', async () => {
      const content = 'Date,Amount,Name\n01/01/2024,100,Test\n02/01/2024,200,Test2';

      const result = await service.previewContent(content);

      expect(result.headers).toEqual(['Date', 'Amount', 'Name']);
      expect(result.rows).toHaveLength(2);
      expect(result.totalRows).toBe(2);
    });

    it('should throw for empty content', async () => {
      await expect(service.previewContent('')).rejects.toThrow(BadRequestException);
    });
  });
});
