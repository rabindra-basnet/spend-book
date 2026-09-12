import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportRowEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sourceRowNumber!: number;

  @ApiPropertyOptional()
  date?: string;

  @ApiPropertyOptional()
  amount?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class ImportEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  rowsCount!: number;

  @ApiPropertyOptional()
  accountId?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiPropertyOptional()
  dateColLabel?: string;

  @ApiPropertyOptional()
  amountColLabel?: string;

  @ApiPropertyOptional()
  nameColLabel?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ImportSessionEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  importType!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  clientSessionId?: string;

  @ApiPropertyOptional()
  expectedChunks?: number;

  @ApiProperty()
  chunksCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ImportPreviewEntity {
  @ApiProperty()
  headers!: string[];

  @ApiProperty({ type: 'array', items: { type: 'array', items: { type: 'string' } } })
  rows!: string[][];

  @ApiProperty()
  totalRows!: number;

  @ApiProperty()
  detectedDelimiter!: string;
}
