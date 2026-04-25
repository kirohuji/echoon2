import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BindConfigDto } from './dto/bind-config.dto';

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

  async bindConfig(deviceId: string, dto: BindConfigDto) {
    const bank = await this.prisma.questionBank.findFirst({
      where: {
        province: dto.province,
        language: dto.language,
        examType: dto.examType,
        interviewForm: dto.interviewForm,
        status: 'active',
      },
    });

    await this.prisma.userBindingConfig.upsert({
      where: { deviceId },
      create: {
        deviceId,
        province: dto.province,
        language: dto.language,
        examType: dto.examType,
        interviewForm: dto.interviewForm,
        bankId: bank?.id ?? null,
      },
      update: {
        province: dto.province,
        language: dto.language,
        examType: dto.examType,
        interviewForm: dto.interviewForm,
        bankId: bank?.id ?? null,
      },
    });

    // upsert user preference
    await this.prisma.userPreference.upsert({
      where: { deviceId },
      create: { deviceId },
      update: {},
    });

    return {
      bankId: bank?.id ?? null,
      bankName: bank?.name ?? null,
      province: dto.province,
      language: dto.language,
      examType: dto.examType,
      interviewForm: dto.interviewForm,
    };
  }

  async getCurrentConfig(deviceId: string) {
    const config = await this.prisma.userBindingConfig.findUnique({
      where: { deviceId },
      include: { bank: true },
    });
    return config;
  }

  async getBootstrap(deviceId: string) {
    const config = await this.prisma.userBindingConfig.findUnique({
      where: { deviceId },
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
}
