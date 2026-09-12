import { ApiProperty } from '@nestjs/swagger';

export class MoneyEntity {
  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;
}

export class NetWorthEntity {
  @ApiProperty({ type: MoneyEntity })
  netWorth!: MoneyEntity;

  @ApiProperty({ type: MoneyEntity })
  assets!: MoneyEntity;

  @ApiProperty({ type: MoneyEntity })
  liabilities!: MoneyEntity;
}

export class CategoryBreakdownEntity {
  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  categoryColor!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  weight!: number;
}

export class IncomeExpenseEntity {
  @ApiProperty({ type: MoneyEntity })
  income!: MoneyEntity;

  @ApiProperty({ type: MoneyEntity })
  expense!: MoneyEntity;

  @ApiProperty({ type: MoneyEntity })
  netSavings!: MoneyEntity;
}

export class TrendPointEntity {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  income!: number;

  @ApiProperty()
  expenses!: number;

  @ApiProperty()
  net!: number;
}

export class BalanceSheetEntity {
  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: NetWorthEntity })
  netWorth!: NetWorthEntity;

  @ApiProperty({ type: [CategoryBreakdownEntity] })
  assetGroups!: CategoryBreakdownEntity[];

  @ApiProperty({ type: [CategoryBreakdownEntity] })
  liabilityGroups!: CategoryBreakdownEntity[];
}

export class IncomeStatementEntity {
  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: IncomeExpenseEntity })
  totals!: IncomeExpenseEntity;

  @ApiProperty({ type: [CategoryBreakdownEntity] })
  incomeByCategory!: CategoryBreakdownEntity[];

  @ApiProperty({ type: [CategoryBreakdownEntity] })
  expenseByCategory!: CategoryBreakdownEntity[];

  @ApiProperty({ type: [TrendPointEntity] })
  trends!: TrendPointEntity[];
}
