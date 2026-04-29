import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, toPageResult } from '../../common/dto/pagination.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(pagination: PaginationDto) {
    const { page = 1, pageSize = 20, keyword } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (keyword) {
      where.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
        { username: keyword ? { contains: keyword, mode: 'insensitive' } : undefined },
      ].filter(Boolean);
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          image: true,
          role: true,
          emailVerified: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPageResult(list, total, pagination);
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        role: true,
        emailVerified: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            practiceRecords: true,
            mockExamRecords: true,
            vocabularyWords: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, currentUserId: string) {
    if (userId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
}
