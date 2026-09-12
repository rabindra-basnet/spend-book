import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  familyId!: string;

  @ApiPropertyOptional()
  userId?: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
