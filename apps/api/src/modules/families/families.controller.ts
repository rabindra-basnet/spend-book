import {
  Controller,
  Get,
  Patch,
  Post,
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
import { FamiliesService } from './families.service.js';
import {
  CreateInvitationDto,
  UpdateFamilySettingsDto,
} from './dto/families.dto.js';
import { FamilyEntity } from './entities/family.entity.js';
import { CurrentFamily } from '@/common/decorators/current-family.decorator.js';
import { CurrentUser } from '@/common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.js';
import { Public } from '@/common/decorators/public.decorator.js';

@ApiTags('families')
@ApiBearerAuth()
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get details and members of active family' })
  getCurrentFamily(@CurrentFamily() familyId: string) {
    return this.familiesService.getFamily(familyId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update settings of active family' })
  updateSettings(
    @CurrentFamily() familyId: string,
    @Body() dto: UpdateFamilySettingsDto,
  ) {
    return this.familiesService.updateSettings(familyId, dto);
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Create an invitation for a new member' })
  createInvitation(
    @CurrentFamily() familyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.familiesService.createInvitation(familyId, user.id, dto);
  }

  @Public()
  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  acceptInvitation(
    @Param('token') token: string,
    @Body('userId') userId: string,
  ) {
    return this.familiesService.acceptInvitation(token, userId);
  }

  @Delete('members/:userId')
  @ApiOperation({ summary: 'Remove a member from the active family' })
  removeMember(
    @CurrentFamily() familyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') targetUserId: string,
  ) {
    return this.familiesService.removeMember(familyId, targetUserId, user.id);
  }
}
