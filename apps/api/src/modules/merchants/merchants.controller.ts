import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { MerchantsService } from './merchants.service.js';
import { CreateMerchantDto } from './dto/merchants.dto.js';
import { MerchantEntity } from './entities/merchant.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('merchants')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  @ApiOperation({ summary: 'List merchants associated with active family' })
  @ApiOkResponse({ type: [MerchantEntity] })
  listMerchants(@CurrentFamily() familyId: string) {
    return this.merchantsService.listMerchants(familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or find deduplicated merchant' })
  @ApiOkResponse({ type: MerchantEntity })
  createMerchant(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateMerchantDto,
  ) {
    return this.merchantsService.findOrCreateMerchant(familyId, dto.name);
  }
}
