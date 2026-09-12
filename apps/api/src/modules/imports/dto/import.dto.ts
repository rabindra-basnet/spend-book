import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ImportType {
  CSV = 'csv',
  QIF = 'qif',
  PDF = 'pdf',
}

export enum ImportStatus {
  PENDING = 'pending',
  IMPORTING = 'importing',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export class CreateImportDto {
  @ApiProperty({ enum: ImportType, description: 'Import file type' })
  @IsEnum(ImportType)
  type!: ImportType;

  @ApiPropertyOptional({ description: 'Target account ID for the import' })
  @IsOptional()
  @IsString()
  accountId?: string;
}

export class UploadChunkDto {
  @ApiProperty({ description: 'Chunk sequence number' })
  @IsNumber()
  sequence!: number;

  @ApiPropertyOptional({ description: 'Client-assigned chunk ID' })
  @IsOptional()
  @IsString()
  clientChunkId?: string;

  @ApiProperty({ description: 'CSV/NDJSON content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  filename?: string;
}

export class ColumnMappingDto {
  @ApiProperty()
  @IsString()
  sourceColumn!: string;

  @ApiProperty()
  @IsString()
  targetField!: string;
}

export class ConfigureImportDto {
  @ApiPropertyOptional({ description: 'Date column label' })
  @IsOptional()
  @IsString()
  dateColLabel?: string;

  @ApiPropertyOptional({ description: 'Amount column label' })
  @IsOptional()
  @IsString()
  amountColLabel?: string;

  @ApiPropertyOptional({ description: 'Name/description column label' })
  @IsOptional()
  @IsString()
  nameColLabel?: string;

  @ApiPropertyOptional({ description: 'Category column label' })
  @IsOptional()
  @IsString()
  categoryColLabel?: string;

  @ApiPropertyOptional({ description: 'Notes column label' })
  @IsOptional()
  @IsString()
  notesColLabel?: string;

  @ApiPropertyOptional({ description: 'Date format string', default: '%m/%d/%Y' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Column separator', default: ',' })
  @IsOptional()
  @IsString()
  colSep?: string;

  @ApiPropertyOptional({ description: 'Rows to skip from start', default: 0 })
  @IsOptional()
  @IsNumber()
  rowsToSkip?: number;

  @ApiPropertyOptional({ description: 'Signage convention', default: 'inflows_positive' })
  @IsOptional()
  @IsString()
  signageConvention?: string;

  @ApiPropertyOptional({ type: [ColumnMappingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnMappingDto)
  columnMappings?: ColumnMappingDto[];
}

export class ImportQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ImportStatus })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 25 })
  @IsOptional()
  @IsNumber()
  perPage?: number;
}
