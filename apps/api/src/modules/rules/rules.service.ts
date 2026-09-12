import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateRuleDto } from './dto/rules.dto.js';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRules(familyId: string) {
    return this.prisma.rule.findMany({
      where: { familyId },
      include: {
        conditions: true,
        actions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(familyId: string, dto: CreateRuleDto) {
    return this.prisma.rule.create({
      data: {
        familyId,
        name: dto.name,
        conditions: {
          create: dto.conditions.map((c) => ({
            operator: c.operator,
            property: c.property,
            value: c.value,
          })),
        },
        actions: {
          create: dto.actions.map((a) => ({
            actionType: a.actionType,
            targetValue: a.targetValue,
          })),
        },
      },
      include: {
        conditions: true,
        actions: true,
      },
    });
  }

  evaluateCondition(
    condition: { operator: string; property: string; value: string },
    tx: { name: string; amount: number },
  ): boolean {
    const val = condition.property === 'amount' ? tx.amount : tx.name;
    const target = condition.value;

    switch (condition.operator) {
      case 'equals':
        return String(val).toLowerCase() === target.toLowerCase();
      case 'contains':
        return String(val).toLowerCase().includes(target.toLowerCase());
      case 'starts_with':
        return String(val).toLowerCase().startsWith(target.toLowerCase());
      case 'greater_than':
        return Number(val) > Number(target);
      case 'less_than':
        return Number(val) < Number(target);
      default:
        return false;
    }
  }

  async applyRulesToTransaction(
    familyId: string,
    tx: { name: string; amount: number },
  ): Promise<{ categoryId?: string; merchantId?: string; notes?: string }> {
    const rules = await this.listRules(familyId);
    const result: { categoryId?: string; merchantId?: string; notes?: string } =
      {};

    for (const rule of rules) {
      const allMatch = rule.conditions.every((c) =>
        this.evaluateCondition(c, tx),
      );
      if (allMatch && rule.conditions.length > 0) {
        for (const action of rule.actions) {
          if (action.actionType === 'set_category')
            result.categoryId = action.targetValue;
          if (action.actionType === 'set_merchant')
            result.merchantId = action.targetValue;
          if (action.actionType === 'set_notes')
            result.notes = action.targetValue;
        }
      }
    }

    return result;
  }
}
