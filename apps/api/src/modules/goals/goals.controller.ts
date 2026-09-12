import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service.js';
import { CreateGoalDto, CreatePledgeDto } from './dto/goals.dto.js';
import { GoalEntity, GoalPledgeEntity } from './entities/goal.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List goals with rollover progress math' })
  @ApiOkResponse({ type: [GoalEntity] })
  listGoals(@CurrentFamily() familyId: string) {
    return this.goalsService.listGoals(familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create goal target' })
  @ApiCreatedResponse({ type: GoalEntity })
  createGoal(@CurrentFamily() familyId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(familyId, dto);
  }

  @Post(':id/pledges')
  @ApiOperation({ summary: 'Add a pledge saving allocation to a goal' })
  @ApiCreatedResponse({ type: GoalPledgeEntity })
  addPledge(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Body() dto: CreatePledgeDto,
  ) {
    return this.goalsService.addPledge(id, familyId, dto);
  }
}
