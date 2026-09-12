import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateGoalDto, CreatePledgeDto } from './dto/goals.dto.js';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listGoals(familyId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { familyId },
      include: {
        goalPledges: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => {
      const progress = this.calculateGoalProgress(g, new Date());
      return {
        ...g,
        progress,
      };
    });
  }

  async createGoal(familyId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        familyId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        currency: dto.currency ?? 'USD',
      },
    });
  }

  async addPledge(goalId: string, familyId: string, dto: CreatePledgeDto) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, familyId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    return this.prisma.goalPledge.create({
      data: {
        goalId: goal.id,
        amount: dto.amount,
        kind: dto.kind ?? 'manual_save',
        status: 'open',
      },
    });
  }

  calculateGoalProgress(
    goal: {
      targetAmount: any;
      createdAt: Date;
      targetDate: Date | null;
      goalPledges: { amount: any; status: string }[];
    },
    now = new Date(),
  ): {
    targetAmount: number;
    completedAmount: number;
    percentage: number;
    remainingAmount: number;
  } {
    const targetAmount = Number(goal.targetAmount);
    const completedAmount = goal.goalPledges.reduce((sum, p) => {
      return sum + Number(p.amount);
    }, 0);

    const percentage =
      targetAmount > 0
        ? Math.min(100, Math.round((completedAmount / targetAmount) * 100))
        : 0;
    const remainingAmount = Math.max(0, targetAmount - completedAmount);

    return {
      targetAmount,
      completedAmount,
      percentage,
      remainingAmount,
    };
  }
}
