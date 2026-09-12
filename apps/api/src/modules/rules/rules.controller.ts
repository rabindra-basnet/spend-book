import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RulesService } from './rules.service.js';
import { CreateRuleDto } from './dto/rules.dto.js';
import { RuleEntity } from './entities/rule.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('rules')
@ApiBearerAuth()
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'List rules for active family' })
  @ApiOkResponse({ type: [RuleEntity] })
  listRules(@CurrentFamily() familyId: string) {
    return this.rulesService.listRules(familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create auto-categorization rule' })
  @ApiOkResponse({ type: RuleEntity })
  createRule(@CurrentFamily() familyId: string, @Body() dto: CreateRuleDto) {
    return this.rulesService.createRule(familyId, dto);
  }
}
