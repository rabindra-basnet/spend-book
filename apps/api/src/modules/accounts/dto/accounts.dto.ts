import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum AccountType {
  DEPOSITORY = 'depository',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  LOAN = 'loan',
  PROPERTY = 'property',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

export class CreateAccountDto {
  @ApiProperty({ description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: AccountType,
    description: 'Account classification type',
  })
  @IsEnum(AccountType)
  accountType!: AccountType;

  @ApiProperty({ description: 'Initial balance' })
  @IsNumber()
  balance!: number;

  @ApiPropertyOptional({ description: 'Currency ISO code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Balance' })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ description: 'Currency ISO code' })
  @IsOptional()
  @IsString()
  currency?: string;
}
