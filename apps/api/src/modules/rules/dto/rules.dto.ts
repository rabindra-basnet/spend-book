import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RuleOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
}

export enum RuleProperty {
  NAME = 'name',
  AMOUNT = 'amount',
}

export enum RuleActionType {
  SET_CATEGORY = 'set_category',
  SET_MERCHANT = 'set_merchant',
  SET_NOTES = 'set_notes',
}

export class RuleConditionInputDto {
  @ApiProperty({ enum: RuleOperator })
  @IsEnum(RuleOperator)
  operator!: RuleOperator;

  @ApiProperty({ enum: RuleProperty })
  @IsEnum(RuleProperty)
  property!: RuleProperty;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class RuleActionInputDto {
  @ApiProperty({ enum: RuleActionType })
  @IsEnum(RuleActionType)
  actionType!: RuleActionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetValue!: string;
}

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: [RuleConditionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionInputDto)
  conditions!: RuleConditionInputDto[];

  @ApiProperty({ type: [RuleActionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionInputDto)
  actions!: RuleActionInputDto[];
}
