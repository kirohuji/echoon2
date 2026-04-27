import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BindConfigDto } from './dto/bind-config.dto';

type UserBindingIdentity = {
  deviceId?: string;
  userId?: string;
};

@Injectable()
export class ConfigGuideService {
  constructor(private readonly prisma: PrismaService) {}

  async getOptions() {
    const banks = await this.prisma.questionBank.findMany({
      where: { status: 'active' },
      select: { province: true, language: true, examType: true, interviewForm: true },
    });

    const toOptions = (arr: string[]) =>
      arr.map((v) => ({ label: v, value: v }));

    return {
      provinces: toOptions([...new Set(banks.map((b) => b.province))]),
      languages: toOptions([...new Set(banks.map((b) => b.language))]),
      examTypes: toOptions([...new Set(banks.map((b) => b.examType))]),
      interviewForms: toOptions([...new Set(banks.map((b) => b.interviewForm))]),
    };
  }

  async bindConfig(identity: UserBindingIdentity, dto: BindConfigDto) {
    const bank = await this.prisma.questionBank.findFirst({
      where: {
        province: dto.province,
        language: dto.language,
        examType: dto.examType,
        interviewForm: dto.interviewForm,
        status: 'active',
      },
    });

    const payload = {
      province: dto.province,
      language: dto.language,
      examType: dto.examType,
      interviewForm: dto.interviewForm,
      bankId: bank?.id ?? null,
    };

    if (identity.userId) {
      const existingByDevice = identity.deviceId
        ? await this.prisma.userBindingConfig.findFirst({
            where: {
              deviceId: identity.deviceId,
              OR: [{ userId: null }, { userId: identity.userId }],
            },
          })
        : null;

      if (existingByDevice) {
        await this.prisma.userBindingConfig.update({
          where: { id: existingByDevice.id },
          data: {
            ...payload,
            userId: identity.userId,
            deviceId: identity.deviceId ?? existingByDevice.deviceId,
          },
        });
      } else {
        await this.prisma.userBindingConfig.upsert({
          where: { userId: identity.userId },
          create: {
            ...payload,
            userId: identity.userId,
            deviceId: identity.deviceId ?? null,
          },
          update: {
            ...payload,
            ...(identity.deviceId ? { deviceId: identity.deviceId } : {}),
          },
        });
      }
    } else if (identity.deviceId) {
      await this.prisma.userBindingConfig.upsert({
        where: { deviceId: identity.deviceId },
        create: {
          ...payload,
          deviceId: identity.deviceId,
        },
        update: payload,
      });
    } else {
      throw new NotFoundException('缺少设备标识');
    }

    // upsert user preference
    if (identity.deviceId) {
      await this.prisma.userPreference.upsert({
        where: { deviceId: identity.deviceId },
        create: { deviceId: identity.deviceId },
        update: {},
      });
    }

    return {
      bankId: bank?.id ?? null,
      bankName: bank?.name ?? null,
      province: dto.province,
      language: dto.language,
      examType: dto.examType,
      interviewForm: dto.interviewForm,
    };
  }

  async getCurrentConfig(identity: UserBindingIdentity) {
    return this.findBindingConfigSimple(identity);
  }

  async getBootstrap(identity: UserBindingIdentity) {
    const config = await this.findBindingConfigWithTopics(identity);

    if (!config) {
      return { configured: false, config: null, bank: null };
    }

    return {
      configured: true,
      config: {
        province: config.province,
        language: config.language,
        examType: config.examType,
        interviewForm: config.interviewForm,
      },
      bank: config.bank
        ? {
            id: config.bank.id,
            name: config.bank.name,
            topics: config.bank.topics.map((t) => ({
              id: t.id,
              code: t.code,
              name: t.name,
              questionCount: t._count.items,
            })),
          }
        : null,
    };
  }

  private async findBindingConfigSimple(identity: UserBindingIdentity) {
    if (identity.userId) {
      const config = await this.prisma.userBindingConfig.findUnique({
        where: { userId: identity.userId },
        include: { bank: true },
      });
      if (config) return config;
    }

    if (!identity.deviceId) {
      return null;
    }

    return this.prisma.userBindingConfig.findUnique({
      where: { deviceId: identity.deviceId },
      include: { bank: true },
    });
  }

  private async findBindingConfigWithTopics(identity: UserBindingIdentity) {
    if (identity.userId) {
      const config = await this.prisma.userBindingConfig.findUnique({
        where: { userId: identity.userId },
        include: {
          bank: {
            include: {
              topics: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  _count: { select: { items: true } },
                },
              },
            },
          },
        },
      });
      if (config) return config;
    }

    if (!identity.deviceId) {
      return null;
    }

    return this.prisma.userBindingConfig.findUnique({
      where: { deviceId: identity.deviceId },
      include: {
        bank: {
          include: {
            topics: {
              orderBy: { sortOrder: 'asc' },
              include: {
                _count: { select: { items: true } },
              },
            },
          },
        },
      },
    });
  }
}
