import { Controller, Get, Headers, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { QuestionBankService } from './question-bank.service';
import { getOptionalAuthSession } from '../auth/session.util';

@Controller('question-bank')
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get('home')
  async getHome(
    @Req() req: Request,
    @Headers('x-device-id') deviceId: string,
    @Query('mode') mode?: string,
    @Query('keyword') keyword?: string,
  ) {
    const session = await getOptionalAuthSession(req);
    return this.questionBankService.getHome(
      { deviceId, userId: session?.user?.id },
      mode,
      keyword,
    );
  }
}
