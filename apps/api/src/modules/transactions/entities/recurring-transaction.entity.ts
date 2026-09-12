import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecurringTransactionEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  familyId!: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  expectedDayOfMonth!: number;

  @ApiProperty()
  nextExpectedDate!: Date;

  @ApiProperty()
  lastOccurrenceDate!: Date;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class RecurringOccurrenceEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  recurringTransactionId!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  dueOn!: Date;

  @ApiProperty()
  originalDueOn!: Date;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  snoozedUntil?: Date | null;
}
