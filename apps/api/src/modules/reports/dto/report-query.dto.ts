import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum PeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YTD = 'ytd',
  LAST_6_MONTHS = 'last_6_months',
  CUSTOM = 'custom',
}

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: PeriodType, default: PeriodType.MONTHLY })
  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
