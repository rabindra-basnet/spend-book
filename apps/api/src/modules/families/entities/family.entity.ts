import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FamilyEntity {
  @ApiProperty({ example: 'fam-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'Doe Family' })
  name!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({ example: 'US' })
  country?: string | null;

  @ApiPropertyOptional({ example: 'en-US' })
  locale?: string | null;

  @ApiPropertyOptional({ example: 'America/New_York' })
  timezone?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<FamilyEntity>) {
    Object.assign(this, partial);
  }
}
