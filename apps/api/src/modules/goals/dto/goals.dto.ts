import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ description: 'Goal name', example: 'Emergency Fund' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Target amount for the goal', example: 10000 })
  @IsNumber()
  @Min(0)
  targetAmount!: number;

  @ApiPropertyOptional({
    description: 'Target completion date ISO string',
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    description: 'Currency ISO code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}

export enum PledgeKind {
  TRANSFER = 'transfer',
  MANUAL_SAVE = 'manual_save',
}

export class CreatePledgeDto {
  @ApiProperty({ description: 'Pledge amount', example: 250 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    enum: PledgeKind,
    default: PledgeKind.MANUAL_SAVE,
    example: PledgeKind.MANUAL_SAVE,
  })
  @IsOptional()
  @IsEnum(PledgeKind)
  kind?: PledgeKind;
}
