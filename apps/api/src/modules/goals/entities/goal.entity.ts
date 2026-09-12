import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoalProgressEntity {
  @ApiProperty({ example: 10000 })
  targetAmount!: number;

  @ApiProperty({ example: 2500 })
  completedAmount!: number;

  @ApiProperty({ example: 25 })
  percentage!: number;

  @ApiProperty({ example: 7500 })
  remainingAmount!: number;
}

export class GoalPledgeEntity {
  @ApiProperty({ example: 'pledge-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'goal-uuid-1' })
  goalId!: string;

  @ApiProperty({ example: 250 })
  amount!: number;

  @ApiProperty({ example: 'manual_save' })
  kind!: string;

  @ApiProperty({ example: 'open' })
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class GoalEntity {
  @ApiProperty({ example: 'goal-uuid-1' })
  id!: string;

  @ApiProperty({ example: 'fam-uuid-1' })
  familyId!: string;

  @ApiProperty({ example: 'Emergency Fund' })
  name!: string;

  @ApiProperty({ example: 10000 })
  targetAmount!: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  targetDate?: Date | null;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({ type: () => [GoalPledgeEntity] })
  goalPledges?: GoalPledgeEntity[];

  @ApiPropertyOptional({ type: () => GoalProgressEntity })
  progress?: GoalProgressEntity;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<GoalEntity>) {
    Object.assign(this, partial);
  }
}
