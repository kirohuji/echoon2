import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, toPageResult } from '../../common/dto/pagination.dto';
import { AddWordDto } from './dto/add-word.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavorites(deviceId: string, pagination: PaginationDto) {
    const { page = 1, pageSize = 20 } = pagination;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.favoriteQuestion.findMany({
        where: { deviceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          question: {
            include: { content: true },
          },
        },
      }),
      this.prisma.favoriteQuestion.count({ where: { deviceId } }),
    ]);

    return toPageResult(list, total, pagination);
  }

  async addFavorite(deviceId: string, questionId: string) {
    const question = await this.prisma.questionItem.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const existing = await this.prisma.favoriteQuestion.findUnique({
      where: { deviceId_questionId: { deviceId, questionId } },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.favoriteQuestion.create({
      data: { deviceId, questionId },
    });
  }

  async removeFavorite(deviceId: string, questionId: string) {
    const existing = await this.prisma.favoriteQuestion.findUnique({
      where: { deviceId_questionId: { deviceId, questionId } },
    });
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favoriteQuestion.delete({
      where: { deviceId_questionId: { deviceId, questionId } },
    });

    return { success: true };
  }

  async getWords(deviceId: string, pagination: PaginationDto) {
    const { page = 1, pageSize = 20 } = pagination;
    const skip = (page - 1) * pageSize;

    const where: any = { deviceId };
    if (pagination.keyword) {
      where.term = { contains: pagination.keyword, mode: 'insensitive' };
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.vocabularyWord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          sourceQuestion: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.vocabularyWord.count({ where }),
    ]);

    return toPageResult(list, total, pagination);
  }

  async addWord(deviceId: string, dto: AddWordDto) {
    const existing = await this.prisma.vocabularyWord.findUnique({
      where: { deviceId_term: { deviceId, term: dto.term } },
    });
    if (existing) {
      return this.prisma.vocabularyWord.update({
        where: { deviceId_term: { deviceId, term: dto.term } },
        data: {
          definition: dto.definition ?? existing.definition,
          sourceQuestionId: dto.sourceQuestionId ?? existing.sourceQuestionId,
        },
      });
    }

    return this.prisma.vocabularyWord.create({
      data: {
        deviceId,
        term: dto.term,
        definition: dto.definition ?? null,
        sourceQuestionId: dto.sourceQuestionId ?? null,
      },
    });
  }

  async removeWord(deviceId: string, term: string) {
    const existing = await this.prisma.vocabularyWord.findUnique({
      where: { deviceId_term: { deviceId, term } },
    });
    if (!existing) {
      throw new NotFoundException('Word not found');
    }

    await this.prisma.vocabularyWord.delete({
      where: { deviceId_term: { deviceId, term } },
    });

    return { success: true };
  }
}
