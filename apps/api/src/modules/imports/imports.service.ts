import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateImportDto,
  UploadChunkDto,
  ConfigureImportDto,
  ImportQueryDto,
  ImportStatus,
} from './dto/import.dto.js';
import type { ImportEntity, ImportSessionEntity, ImportPreviewEntity } from './entities/import.entity.js';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listImports(familyId: string, query: ImportQueryDto) {
    const page = query.page || 1;
    const perPage = Math.min(query.perPage || 25, 100);
    const skip = (page - 1) * perPage;

    const where: any = { familyId };
    if (query.status) {
      where.status = query.status;
    }

    const [imports, total] = await Promise.all([
      this.prisma.import.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.import.count({ where }),
    ]);

    return {
      data: imports,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getImport(id: string, familyId: string): Promise<ImportEntity> {
    const importRecord = await this.prisma.import.findFirst({
      where: { id, familyId },
    });

    if (!importRecord) {
      throw new NotFoundException(`Import with ID ${id} not found`);
    }

    return this.toEntity(importRecord);
  }

  async createImport(familyId: string, dto: CreateImportDto): Promise<ImportEntity> {
    const importRecord = await this.prisma.import.create({
      data: {
        familyId,
        type: dto.type,
        status: ImportStatus.PENDING,
        accountId: dto.accountId || null,
      },
    });

    return this.toEntity(importRecord);
  }

  async uploadContent(
    id: string,
    familyId: string,
    content: string,
    filename?: string,
  ): Promise<ImportEntity> {
    const importRecord = await this.prisma.import.findFirst({
      where: { id, familyId },
    });

    if (!importRecord) {
      throw new NotFoundException(`Import with ID ${id} not found`);
    }

    if (importRecord.status !== ImportStatus.PENDING) {
      throw new BadRequestException('Import is not in pending status');
    }

    const updated = await this.prisma.import.update({
      where: { id },
      data: {
        rawFileStr: content,
        filename: filename || 'upload.csv',
      },
    });

    return this.toEntity(updated);
  }

  async configureImport(
    id: string,
    familyId: string,
    dto: ConfigureImportDto,
  ): Promise<ImportEntity> {
    const importRecord = await this.prisma.import.findFirst({
      where: { id, familyId },
    });

    if (!importRecord) {
      throw new NotFoundException(`Import with ID ${id} not found`);
    }

    const updated = await this.prisma.import.update({
      where: { id },
      data: {
        dateColLabel: dto.dateColLabel,
        amountColLabel: dto.amountColLabel,
        nameColLabel: dto.nameColLabel,
        categoryColLabel: dto.categoryColLabel,
        notesColLabel: dto.notesColLabel,
        dateFormat: dto.dateFormat || '%m/%d/%Y',
        colSep: dto.colSep || ',',
        rowsToSkip: dto.rowsToSkip || 0,
        signageConvention: dto.signageConvention || 'inflows_positive',
        columnMappings: dto.columnMappings ? JSON.parse(JSON.stringify(dto.columnMappings)) : undefined,
      },
    });

    return this.toEntity(updated);
  }

  async publishImport(id: string, familyId: string): Promise<ImportEntity> {
    const importRecord = await this.prisma.import.findFirst({
      where: { id, familyId },
    });

    if (!importRecord) {
      throw new NotFoundException(`Import with ID ${id} not found`);
    }

    if (importRecord.status !== ImportStatus.PENDING) {
      throw new BadRequestException('Import is not in pending status');
    }

    const updated = await this.prisma.import.update({
      where: { id },
      data: { status: ImportStatus.IMPORTING },
    });

    this.logger.log(`Import ${id} queued for processing`);

    return this.toEntity(updated);
  }

  async getImportRows(id: string, familyId: string, page = 1, perPage = 25) {
    const importRecord = await this.prisma.import.findFirst({
      where: { id, familyId },
    });

    if (!importRecord) {
      throw new NotFoundException(`Import with ID ${id} not found`);
    }

    const skip = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      this.prisma.importRow.findMany({
        where: { importId: id },
        orderBy: { sourceRowNumber: 'asc' },
        skip,
        take: perPage,
      }),
      this.prisma.importRow.count({ where: { importId: id } }),
    ]);

    return {
      data: rows,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async createImportSession(
    familyId: string,
    importType: string,
    clientSessionId?: string,
    expectedChunks?: number,
  ): Promise<ImportSessionEntity> {
    const session = await this.prisma.importSession.create({
      data: {
        familyId,
        importType,
        clientSessionId: clientSessionId || randomUUID(),
        expectedChunks: expectedChunks || null,
      },
    });

    return this.toSessionEntity(session);
  }

  async getImportSession(id: string, familyId: string): Promise<ImportSessionEntity> {
    const session = await this.prisma.importSession.findFirst({
      where: { id, familyId },
    });

    if (!session) {
      throw new NotFoundException(`Import session with ID ${id} not found`);
    }

    return this.toSessionEntity(session);
  }

  async uploadChunk(
    sessionId: string,
    familyId: string,
    dto: UploadChunkDto,
  ): Promise<ImportSessionEntity> {
    const session = await this.prisma.importSession.findFirst({
      where: { id: sessionId, familyId },
    });

    if (!session) {
      throw new NotFoundException(`Import session with ID ${sessionId} not found`);
    }

    await this.prisma.import.create({
      data: {
        familyId,
        importSessionId: sessionId,
        type: session.importType,
        status: ImportStatus.PENDING,
        sequence: dto.sequence,
        clientChunkId: dto.clientChunkId,
        rawFileStr: dto.content,
        filename: dto.filename || `chunk-${dto.sequence}.csv`,
      },
    });

    const updatedSession = await this.prisma.importSession.findUnique({
      where: { id: sessionId },
    });

    return this.toSessionEntity(updatedSession!);
  }

  async publishSession(sessionId: string, familyId: string): Promise<ImportSessionEntity> {
    const session = await this.prisma.importSession.findFirst({
      where: { id: sessionId, familyId },
    });

    if (!session) {
      throw new NotFoundException(`Import session with ID ${sessionId} not found`);
    }

    await this.prisma.importSession.update({
      where: { id: sessionId },
      data: { status: ImportStatus.IMPORTING },
    });

    await this.prisma.import.updateMany({
      where: { importSessionId: sessionId, status: ImportStatus.PENDING },
      data: { status: ImportStatus.IMPORTING },
    });

    this.logger.log(`Import session ${sessionId} queued for processing`);

    const updatedSession = await this.prisma.importSession.findUnique({
      where: { id: sessionId },
    });

    return this.toSessionEntity(updatedSession!);
  }

  async previewContent(content: string): Promise<ImportPreviewEntity> {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      throw new BadRequestException('Content is empty');
    }

    const detectedDelimiter = this.detectDelimiter(lines[0]);
    const headers = this.parseCsvLine(lines[0], detectedDelimiter);
    const rows = lines.slice(1, 6).map((line) => this.parseCsvLine(line, detectedDelimiter));

    return {
      headers,
      rows,
      totalRows: lines.length - 1,
      detectedDelimiter,
    };
  }

  private toEntity(record: any): ImportEntity {
    return {
      id: record.id,
      familyId: record.familyId,
      type: record.type,
      status: record.status,
      rowsCount: record.rowsCount || 0,
      accountId: record.accountId,
      error: record.error,
      dateColLabel: record.dateColLabel,
      amountColLabel: record.amountColLabel,
      nameColLabel: record.nameColLabel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toSessionEntity(record: any): ImportSessionEntity {
    return {
      id: record.id,
      importType: record.importType,
      status: record.status,
      clientSessionId: record.clientSessionId,
      expectedChunks: record.expectedChunks,
      chunksCount: 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private detectDelimiter(headerLine: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let detected = ',';

    for (const delimiter of delimiters) {
      const count = (headerLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detected = delimiter;
      }
    }

    return detected;
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }

    result.push(current.trim());
    return result;
  }
}
