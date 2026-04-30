import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigGuideModule } from './modules/config-guide/config-guide.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { PracticeModule } from './modules/practice/practice.module';
import { AssetsModule } from './modules/assets/assets.module';
import { MockExamModule } from './modules/mock-exam/mock-exam.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MembershipModule } from './modules/membership/membership.module';
import { TtsModule } from './modules/tts/tts.module';
import { PracticeAiModule } from './modules/practice-ai/practice-ai.module';
import { FileAssetsModule } from './modules/file-assets/file-assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { PayModule } from './modules/pay/pay.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ResourceLibraryModule } from './modules/resource-library/resource-library.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ConfigGuideModule,
    QuestionBankModule,
    PracticeModule,
    AssetsModule,
    MockExamModule,
    ProfileModule,
    MembershipModule,
    TtsModule,
    PracticeAiModule,
    FileAssetsModule,
    AuthModule,
    AdminModule,
    ResourceLibraryModule,
    PayModule,
    NotificationModule,
  ],
})
export class AppModule {}
