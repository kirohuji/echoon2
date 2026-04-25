import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    const plans = await this.prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return plans;
  }

  async getCurrentMembership(deviceId: string) {
    return {
      deviceId,
      plan: null,
      isActive: false,
      expiredAt: null,
      message: '当前为免费版，升级会员可解锁更多功能',
    };
  }
}
