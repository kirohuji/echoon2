import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { QuestionBankAdminController } from './question-bank-admin.controller';
import { QuestionBankAdminService } from './question-bank-admin.service';
import { PayModule } from '../pay/pay.module';

@Module({
  imports: [PayModule],
  controllers: [AdminController, QuestionBankAdminController],
  providers: [AdminService, QuestionBankAdminService],
})
export class AdminModule {}
