import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/budgets.dto.js';
import { BudgetEntity } from './entities/budget.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'List family & personal budgets' })
  @ApiOkResponse({ type: [BudgetEntity] })
  listBudgets(
    @CurrentFamily() familyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.budgetsService.listBudgets(familyId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a budget with category allocations' })
  @ApiCreatedResponse({ type: BudgetEntity })
  createBudget(
    @CurrentFamily() familyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetsService.createBudget(familyId, user.id, dto);
  }
}
