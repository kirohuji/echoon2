import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import type { Prisma } from '@prisma/client'

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; type: string; content: string; contact?: string }) {
    return this.prisma.feedback.create({ data })
  }

  async findByUser(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.feedback.count({ where: { userId } }),
    ])
    return { items, total, page, pageSize }
  }

  async findAll(params: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 20 } = params
    const where: Prisma.FeedbackWhereInput = {}
    if (status) where.status = status as any
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.feedback.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async updateStatus(id: string, status: string, adminNote?: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status: status as any, adminNote },
    })
  }
}
