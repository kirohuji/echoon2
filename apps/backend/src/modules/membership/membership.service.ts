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

  async getCurrentMembership(userId: string) {
    return {
      userId,
      plan: null,
      isActive: false,
      expiredAt: null,
      message: '当前为免费版，升级会员可解锁更多功能',
    };
  }

  getBenefits() {
    return [
      { benefitId: '1', name: '题库使用数量', freeSupport: '1 套', standardSupport: '3 套', advancedSupport: '无限' },
      { benefitId: '2', name: 'AI 练习反馈', freeSupport: false, standardSupport: true, advancedSupport: true },
      { benefitId: '3', name: '模拟考试', freeSupport: '5 次/月', standardSupport: '30 次/月', advancedSupport: '无限' },
      { benefitId: '4', name: '练习记录', freeSupport: true, standardSupport: true, advancedSupport: true },
      { benefitId: '5', name: '收藏题目', freeSupport: true, standardSupport: true, advancedSupport: true },
      { benefitId: '6', name: '生词本', freeSupport: true, standardSupport: true, advancedSupport: true },
      { benefitId: '7', name: '客服支持', freeSupport: false, standardSupport: '工作日', advancedSupport: '全天' },
    ];
  }
}
