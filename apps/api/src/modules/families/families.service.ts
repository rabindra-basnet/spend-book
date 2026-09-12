import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service.js';
import {
  CreateInvitationDto,
  UpdateFamilySettingsDto,
} from './dto/families.dto.js';

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFamily(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        invitations: true,
      },
    });

    if (!family) {
      throw new NotFoundException(`Family with ID ${familyId} not found`);
    }

    return family;
  }

  async updateSettings(familyId: string, dto: UpdateFamilySettingsDto) {
    return this.prisma.family.update({
      where: { id: familyId },
      data: dto,
    });
  }

  async createInvitation(
    familyId: string,
    inviterId: string,
    dto: CreateInvitationDto,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, familyId },
    });

    if (existingUser) {
      throw new BadRequestException('User is already a member of this family');
    }

    const token = crypto.randomUUID();

    return this.prisma.invitation.create({
      data: {
        familyId,
        inviterId,
        email: dto.email,
        role: dto.role ?? 'member',
        token,
      },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          familyId: invitation.familyId,
          role: invitation.role ?? 'member',
        },
      }),
      this.prisma.invitation.delete({
        where: { id: invitation.id },
      }),
    ]);

    return { success: true, familyId: invitation.familyId };
  }

  async removeMember(
    familyId: string,
    targetUserId: string,
    requestingUserId: string,
  ) {
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (
      !requestingUser ||
      requestingUser.familyId !== familyId ||
      (requestingUser.role !== 'admin' && requestingUser.role !== 'super_admin')
    ) {
      throw new ForbiddenException('Only family admins can remove members');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.familyId !== familyId) {
      throw new NotFoundException('Member not found in this family');
    }

    // Move to a new standalone family
    const newFamily = await this.prisma.family.create({
      data: {
        name: `${targetUser.email}'s Family`,
        currency: 'USD',
      },
    });

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        familyId: newFamily.id,
        role: 'admin',
      },
    });

    return { success: true };
  }
}
