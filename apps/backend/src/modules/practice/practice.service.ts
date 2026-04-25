import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PracticeActionDto } from './dto/practice-action.dto';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopicQuestions(deviceId: string, topicId: string) {
    const topic = await this.prisma.questionTopic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const items = await this.prisma.questionItem.findMany({
      where: { topicId },
      orderBy: { createdAt: 'asc' },
      include: {
        content: true,
      },
    });

    const progresses = await this.prisma.practiceProgress.findMany({
      where: {
        deviceId,
        questionId: { in: items.map((i) => i.id) },
      },
    });

    const progressMap = new Map(progresses.map((p) => [p.questionId, p]));

    return {
      topicId: topic.id,
      topicName: topic.name,
      total: items.length,
      questions: items.map((item, idx) => {
        const progress = progressMap.get(item.id);
        return {
          questionId: item.id,
          topicId: item.topicId,
          orderIndex: idx + 1,
          questionText: item.content?.promptEn || item.title,
          questionLang: 'en-US',
          referenceAnswer: item.content?.answerEn,
          translation: item.content?.promptZh,
          keywords: item.keywords,
          vocabulary: item.focusWords.map((w) => ({ word: w, meaning: '', phonetic: '' })),
          difficulty: String(item.difficulty),
          tags: item.keywords.slice(0, 2),
          masteryScore: progress?.masteryScore ?? 0,
          seenAt: progress?.seenAt,
        };
      }),
    };
  }

  async getQuestionDetail(deviceId: string, questionId: string) {
    const item = await this.prisma.questionItem.findUnique({
      where: { id: questionId },
      include: {
        content: true,
        topic: {
          include: { bank: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Question not found');
    }

    const progress = await this.prisma.practiceProgress.findUnique({
      where: { deviceId_questionId: { deviceId, questionId } },
    });

    const isFavorited = await this.prisma.favoriteQuestion.findUnique({
      where: { deviceId_questionId: { deviceId, questionId } },
    });

    await this.prisma.practiceProgress.upsert({
      where: { deviceId_questionId: { deviceId, questionId } },
      create: {
        deviceId,
        questionId,
        seenAt: new Date(),
      },
      update: {
        seenAt: new Date(),
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

    return {
      ...item,
      progress: progress
        ? { masteryScore: progress.masteryScore, seenAt: progress.seenAt }
        : null,
      isFavorited: !!isFavorited,
    };
  }

  async recordAction(deviceId: string, dto: PracticeActionDto) {
    const record = await this.prisma.practiceRecord.create({
      data: {
        deviceId,
        questionId: dto.questionId,
        actionType: dto.actionType,
        payload: dto.payload ?? undefined,
      },
    });

    if (dto.actionType === 'rate' && dto.payload?.score !== undefined) {
      const score = Number(dto.payload.score);
      await this.prisma.practiceProgress.upsert({
        where: { deviceId_questionId: { deviceId, questionId: dto.questionId } },
        create: {
          deviceId,
          questionId: dto.questionId,
          masteryScore: score,
          seenAt: new Date(),
        },
        update: {
          masteryScore: score,
        },
      });
    }

    return record;
  }

  async lookupDictionary(term: string) {
    const words = await this.prisma.vocabularyWord.findMany({
      where: {
        term: { contains: term, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const questions = await this.prisma.questionItem.findMany({
      where: {
        OR: [
          { keywords: { has: term } },
          { focusWords: { has: term } },
        ],
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        focusWords: true,
      },
      take: 5,
    });

    return { savedWords: words, relatedQuestions: questions };
  }
}
