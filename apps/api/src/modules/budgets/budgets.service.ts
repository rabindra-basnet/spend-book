import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateBudgetDto } from './dto/budgets.dto.js';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBudgets(familyId: string, userId: string) {
    return this.prisma.budget.findMany({
      where: {
        OR: [
          { familyId, userId: null },
          { familyId, userId },
        ],
      },
      include: {
        budgetCategories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBudget(familyId: string, userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        familyId,
        userId: dto.isPersonal ? userId : null,
        name: dto.name,
        currency: dto.currency ?? 'USD',
        budgetCategories: dto.categories
          ? {
              create: dto.categories.map((c) => ({
                categoryId: c.categoryId,
                allocatedAmount: c.allocatedAmount,
              })),
            }
          : undefined,
      },
      include: {
        budgetCategories: true,
      },
    });
  }
}
