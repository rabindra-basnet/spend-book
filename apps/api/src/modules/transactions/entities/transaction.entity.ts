import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  amount!: number;

  @ApiPropertyOptional()
  currency?: string | null;

  @ApiPropertyOptional()
  date?: Date | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  parentEntryId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
