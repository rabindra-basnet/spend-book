import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum RecurrenceFrequencyDtoEnum {
  weekly = 'weekly',
  monthly = 'monthly',
  yearly = 'yearly',
}

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: 'Netflix Subscription' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 15.99 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({ example: 15 })
  @IsInt()
  @Min(1)
  expectedDayOfMonth!: number;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsString()
  nextExpectedDate?: string;

  @ApiPropertyOptional({ enum: RecurrenceFrequencyDtoEnum })
  @IsOptional()
  @IsEnum(RecurrenceFrequencyDtoEnum)
  frequency?: RecurrenceFrequencyDtoEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  merchantId?: string;
}

export class UpdateOccurrenceStatusDto {
  @ApiProperty({ example: 'paid', enum: ['scheduled', 'paid', 'skipped', 'missed'] })
  @IsString()
  @IsNotEmpty()
  status!: 'scheduled' | 'paid' | 'skipped' | 'missed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  snoozedUntil?: string;
}
