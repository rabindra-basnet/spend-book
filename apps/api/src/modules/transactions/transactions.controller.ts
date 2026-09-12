import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import {
  CreateTransactionDto,
  FilterTransactionsDto,
  SplitTransactionDto,
  CreateTransferDto,
  BulkCategorizeDto,
  BulkDeleteDto,
} from './dto/transactions.dto.js';
import { TransactionEntity } from './entities/transaction.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter transactions for active family' })
  @ApiOkResponse({ type: [TransactionEntity] })
  listTransactions(
    @CurrentFamily() familyId: string,
    @Query() filter: FilterTransactionsDto,
  ) {
    return this.transactionsService.listTransactions(familyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details by ID' })
  @ApiOkResponse({ type: TransactionEntity })
  getTransaction(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.transactionsService.getTransaction(id, familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiOkResponse({ type: TransactionEntity })
  createTransaction(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(familyId, dto);
  }

  @Post(':id/split')
  @ApiOperation({ summary: 'Split a transaction into sub-entries' })
  @ApiOkResponse({ type: [TransactionEntity] })
  createSplit(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Body() dto: SplitTransactionDto,
  ) {
    return this.transactionsService.createSplit(id, familyId, dto);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create paired transfer entries between accounts' })
  createTransfer(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateTransferDto,
  ) {
    return this.transactionsService.createTransfer(familyId, dto);
  }

  @Post('bulk_categorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk assign category to transactions' })
  bulkCategorize(
    @CurrentFamily() familyId: string,
    @Body() dto: BulkCategorizeDto,
  ) {
    return this.transactionsService.bulkCategorize(familyId, dto);
  }

  @Post('bulk_delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete transactions' })
  bulkDelete(@CurrentFamily() familyId: string, @Body() dto: BulkDeleteDto) {
    return this.transactionsService.bulkDelete(familyId, dto);
  }
}
