import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateMerchantDto } from './dto/merchants.dto.js';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMerchants(familyId: string) {
    return this.prisma.merchant.findMany({
      where: {
        familyAssociations: {
          some: { familyId },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOrCreateMerchant(familyId: string, name: string) {
    const trimmed = name.trim();
    let merchant = await this.prisma.merchant.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (!merchant) {
      merchant = await this.prisma.merchant.create({
        data: {
          name: trimmed,
        },
      });
    }

    const association = await this.prisma.familyMerchantAssociation.findUnique({
      where: {
        familyId_merchantId: {
          familyId,
          merchantId: merchant.id,
        },
      },
    });

    if (!association) {
      await this.prisma.familyMerchantAssociation.create({
        data: {
          familyId,
          merchantId: merchant.id,
        },
      });
    }

    return merchant;
  }
}
