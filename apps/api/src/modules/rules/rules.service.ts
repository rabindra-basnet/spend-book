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
        ruleConditions: true,
        ruleActions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(familyId: string, dto: CreateRuleDto) {
    return this.prisma.rule.create({
      data: {
        familyId,
        name: dto.name,
        resourceType: 'transaction',
        ruleConditions: {
          create: dto.conditions.map((c) => ({
            conditionType: c.property,
            operator: c.operator,
            value: c.value,
          })),
        },
        ruleActions: {
          create: dto.actions.map((a) => ({
            actionType: a.actionType,
            value: a.targetValue,
          })),
        },
      },
      include: {
        ruleConditions: true,
        ruleActions: true,
      },
    });
  }

  evaluateCondition(
    condition: {
      operator: string;
      conditionType: string;
      value: string | null;
    },
    tx: { name: string; amount: number },
  ): boolean {
    const val = condition.conditionType === 'amount' ? tx.amount : tx.name;
    const target = condition.value ?? '';

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
      const allMatch = rule.ruleConditions.every((c) =>
        this.evaluateCondition(c, tx),
      );
      if (allMatch && rule.ruleConditions.length > 0) {
        for (const action of rule.ruleActions) {
          if (action.actionType === 'set_category' && action.value)
            result.categoryId = action.value;
          if (action.actionType === 'set_merchant' && action.value)
            result.merchantId = action.value;
          if (action.actionType === 'set_notes' && action.value)
            result.notes = action.value;
        }
      }
    }

    return result;
  }
}
