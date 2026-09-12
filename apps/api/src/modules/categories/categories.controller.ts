import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/categories.dto.js';
import { CategoryEntity } from './entities/category.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories with subcategories' })
  @ApiOkResponse({ type: [CategoryEntity] })
  listCategories(@CurrentFamily() familyId: string) {
    return this.categoriesService.listCategories(familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create category (max 1 subcategory level)' })
  @ApiOkResponse({ type: CategoryEntity })
  createCategory(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(familyId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@CurrentFamily() familyId: string, @Param('id') id: string) {
    return this.categoriesService.deleteCategory(id, familyId);
  }
}
