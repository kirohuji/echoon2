import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PayModule } from '../pay/pay.module';

@Module({
  imports: [PayModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
