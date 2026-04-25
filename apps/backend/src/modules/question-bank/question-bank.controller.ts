import { Controller, Get, Headers, Query } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';

@Controller('question-bank')
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get('home')
  getHome(
    @Headers('x-device-id') deviceId: string,
    @Query('mode') mode?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.questionBankService.getHome(deviceId, mode, keyword);
  }
}
