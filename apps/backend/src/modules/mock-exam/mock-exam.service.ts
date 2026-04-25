import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, toPageResult } from '../../common/dto/pagination.dto';
import { StartExamDto, SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class MockExamService {
  constructor(private readonly prisma: PrismaService) {}

  async getPapers(deviceId: string) {
    const config = await this.prisma.userBindingConfig.findUnique({
      where: { deviceId },
    });

    const where: any = {};
    if (config?.bankId) {
      where.bankId = config.bankId;
    }

    const papers = await this.prisma.mockPaper.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
        bank: { select: { name: true, language: true } },
      },
    });

    const records = await this.prisma.mockExamRecord.findMany({
      where: {
        deviceId,
        paperId: { in: papers.map((p) => p.id) },
      },
      orderBy: { takenAt: 'desc' },
    });

    const recordMap = new Map<string, number>();
    for (const r of records) {
      if (!recordMap.has(r.paperId)) {
        recordMap.set(r.paperId, r.score);
      }
    }

    return papers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      paperType: paper.paperType,
      suggestedMinutes: paper.suggestedMinutes,
      focus: paper.focus,
      questionCount: paper._count.questions,
      bank: paper.bank,
      lastScore: recordMap.get(paper.id) ?? null,
    }));
  }

  async getRecentScores(deviceId: string, pagination: PaginationDto) {
    const { page = 1, pageSize = 20 } = pagination;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.mockExamRecord.findMany({
        where: { deviceId },
        orderBy: { takenAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          paper: {
            select: { title: true, paperType: true, suggestedMinutes: true },
          },
        },
      }),
      this.prisma.mockExamRecord.count({ where: { deviceId } }),
    ]);

    return toPageResult(list, total, pagination);
  }

  async startExam(deviceId: string, dto: StartExamDto) {
    const paper = await this.prisma.mockPaper.findUnique({
      where: { id: dto.paperId },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              include: { content: true },
            },
          },
        },
        bank: { select: { name: true, language: true } },
      },
    });

    if (!paper) {
      throw new NotFoundException('Mock paper not found');
    }

    return {
      paperId: paper.id,
      title: paper.title,
      paperType: paper.paperType,
      suggestedMinutes: paper.suggestedMinutes,
      focus: paper.focus,
      bank: paper.bank,
      questions: paper.questions.map((pq) => ({
        sortOrder: pq.sortOrder,
        question: {
          id: pq.question.id,
          title: pq.question.title,
          difficulty: pq.question.difficulty,
          suggestedDurationSec: pq.question.suggestedDurationSec,
          keywords: pq.question.keywords,
          focusWords: pq.question.focusWords,
          content: pq.question.content,
        },
      })),
    };
  }

  async submitExam(deviceId: string, dto: SubmitExamDto) {
    const paper = await this.prisma.mockPaper.findUnique({
      where: { id: dto.paperId },
    });

    if (!paper) {
      throw new NotFoundException('Mock paper not found');
    }

    const record = await this.prisma.mockExamRecord.create({
      data: {
        deviceId,
        paperId: dto.paperId,
        score: dto.score,
        weakness: dto.weakness ?? [],
      },
    });

    await this.prisma.dailyActivity.upsert({
      where: {
        deviceId_date: {
          deviceId,
          date: new Date(new Date().toISOString().split('T')[0]),
        },
      },
      create: {
        deviceId,
        date: new Date(new Date().toISOString().split('T')[0]),
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    const allScores = await this.prisma.mockExamRecord.findMany({
      where: { deviceId, paperId: dto.paperId },
      orderBy: { takenAt: 'desc' },
      take: 10,
      select: { score: true, takenAt: true },
    });

    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((sum, r) => sum + r.score, 0) / allScores.length)
        : dto.score;

    return {
      record,
      stats: {
        latestScore: dto.score,
        averageScore: avgScore,
        totalAttempts: allScores.length,
      },
    };
  }
}
