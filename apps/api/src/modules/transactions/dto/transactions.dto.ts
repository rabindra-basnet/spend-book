import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ description: 'Transaction name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Merchant ID' })
  @IsOptional()
  @IsString()
  merchantId?: string;
}

export class FilterTransactionsDto {
  @ApiPropertyOptional({ description: 'Account ID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Merchant ID' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SplitItemDto {
  @ApiProperty({ description: 'Split entry name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Split amount' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SplitTransactionDto {
  @ApiProperty({ type: [SplitItemDto], description: 'List of split entries' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  splits!: SplitItemDto[];
}

export class CreateTransferDto {
  @ApiProperty({ description: 'Outflow Account ID' })
  @IsString()
  @IsNotEmpty()
  fromAccountId!: string;

  @ApiProperty({ description: 'Inflow Account ID' })
  @IsString()
  @IsNotEmpty()
  toAccountId!: string;

  @ApiProperty({ description: 'Transfer amount' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Date' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCategorizeDto {
  @ApiProperty({ type: [String], description: 'List of transaction IDs' })
  @IsArray()
  @IsString({ each: true })
  transactionIds!: string[];

  @ApiProperty({ description: 'Target Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}

export class BulkDeleteDto {
  @ApiProperty({ type: [String], description: 'List of transaction IDs' })
  @IsArray()
  @IsString({ each: true })
  transactionIds!: string[];
}
