import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { RecurringTransactionsService } from './recurring-transactions.service.js';
import {
  CreateRecurringTransactionDto,
  UpdateOccurrenceStatusDto,
} from './dto/recurring-transactions.dto.js';
import {
  RecurringTransactionEntity,
  RecurringOccurrenceEntity,
} from './entities/recurring-transaction.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('recurring-transactions')
@ApiBearerAuth()
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly service: RecurringTransactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List family recurring transactions' })
  @ApiOkResponse({ type: [RecurringTransactionEntity] })
  list(@CurrentFamily() familyId: string) {
    return this.service.listRecurringTransactions(familyId);
  }

  @Get('occurrences')
  @ApiOperation({ summary: 'List family recurring occurrences' })
  @ApiOkResponse({ type: [RecurringOccurrenceEntity] })
  listOccurrences(@CurrentFamily() familyId: string) {
    return this.service.listOccurrences(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring transaction details' })
  @ApiOkResponse({ type: RecurringTransactionEntity })
  get(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.service.getRecurringTransaction(id, familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create recurring transaction schedule' })
  @ApiCreatedResponse({ type: RecurringTransactionEntity })
  create(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.service.createRecurringTransaction(familyId, dto);
  }

  @Patch('occurrences/:id')
  @ApiOperation({ summary: 'Update occurrence status (paid/skipped/snoozed)' })
  @ApiOkResponse({ type: RecurringOccurrenceEntity })
  updateOccurrence(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOccurrenceStatusDto,
  ) {
    return this.service.updateOccurrenceStatus(id, familyId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recurring transaction schedule' })
  delete(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.service.deleteRecurringTransaction(id, familyId);
  }
}
