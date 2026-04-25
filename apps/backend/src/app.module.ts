import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigGuideModule } from './modules/config-guide/config-guide.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { PracticeModule } from './modules/practice/practice.module';
import { AssetsModule } from './modules/assets/assets.module';
import { MockExamModule } from './modules/mock-exam/mock-exam.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MembershipModule } from './modules/membership/membership.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ConfigGuideModule,
    QuestionBankModule,
    PracticeModule,
    AssetsModule,
    MockExamModule,
    ProfileModule,
    MembershipModule,
  ],
})
export class AppModule {}
