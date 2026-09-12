import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { ReportQueryDto } from './dto/report-query.dto.js';
import {
  BalanceSheetEntity,
  IncomeStatementEntity,
  CategoryBreakdownEntity,
  MoneyEntity,
} from './entities/report.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet (net worth, assets, liabilities)' })
  @ApiOkResponse({ type: BalanceSheetEntity })
  getBalanceSheet(@CurrentFamily() familyId: string) {
    return this.reportsService.getBalanceSheet(familyId);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Get income statement with category breakdown and trends' })
  @ApiOkResponse({ type: IncomeStatementEntity })
  getIncomeStatement(
    @CurrentFamily() familyId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getIncomeStatement(familyId, query);
  }

  @Get('net-worth')
  @ApiOperation({ summary: 'Get current net worth' })
  @ApiOkResponse({ type: MoneyEntity })
  getNetWorth(@CurrentFamily() familyId: string) {
    return this.reportsService.getNetWorth(familyId);
  }

  @Get('spending-by-category')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  @ApiOkResponse({ type: [CategoryBreakdownEntity] })
  getSpendingByCategory(
    @CurrentFamily() familyId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSpendingByCategory(familyId, query);
  }
}
