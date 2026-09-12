import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service.js';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto.js';
import { AccountEntity } from './entities/account.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List accounts for active family' })
  @ApiOkResponse({ type: [AccountEntity] })
  listAccounts(@CurrentFamily() familyId: string) {
    return this.accountsService.listAccounts(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account details by ID' })
  @ApiOkResponse({ type: AccountEntity })
  getAccount(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.accountsService.getAccount({ id, familyId });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiOkResponse({ type: AccountEntity })
  createAccount(
    @CurrentFamily() familyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.createAccount(familyId, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account details' })
  @ApiOkResponse({ type: AccountEntity })
  updateAccount(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount({ id, familyId }, dto);
  }

  @Get(':id/balances')
  @ApiOperation({ summary: 'Get account balance history' })
  getBalanceHistory(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
  ) {
    return this.accountsService.getBalanceHistory({ id, familyId });
  }

  @Get(':id/holdings')
  @ApiOperation({ summary: 'Get account investment holdings' })
  getHoldings(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.accountsService.getHoldings({ id, familyId });
  }
}
