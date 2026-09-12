import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetCategoryDto {
  @ApiProperty({ description: 'Category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'Allocated budget amount (alias for budgetedSpending)' })
  @IsOptional()
  @IsNumber()
  allocatedAmount?: number;

  @ApiPropertyOptional({ description: 'Budgeted spending amount' })
  @IsOptional()
  @IsNumber()
  budgetedSpending?: number;
}

export class CreateBudgetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isPersonal?: boolean;

  @ApiPropertyOptional({ type: [CreateBudgetCategoryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetCategoryDto)
  categories?: CreateBudgetCategoryDto[];
}
