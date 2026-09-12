import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateCategoryDto } from './dto/categories.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(familyId: string) {
    return this.prisma.category.findMany({
      where: { familyId, parentId: null },
      include: {
        childrenCategories: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(familyId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, familyId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${dto.parentId} not found`,
        );
      }
      if (parent.parentId !== null) {
        throw new BadRequestException(
          'Categories support maximum 1 level of subcategories',
        );
      }
    }

    return this.prisma.category.create({
      data: {
        familyId,
        name: dto.name,
        color: dto.color ?? null,
        icon: dto.icon ?? null,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async deleteCategory(id: string, familyId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, familyId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
