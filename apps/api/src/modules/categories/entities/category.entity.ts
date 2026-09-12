import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiPropertyOptional()
  icon?: string | null;

  @ApiPropertyOptional()
  parentId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
