import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeActionDto } from './dto/practice-action.dto';

@Controller()
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('practice/topic/:topicId/questions')
  getTopicQuestions(
    @Headers('x-device-id') deviceId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.practiceService.getTopicQuestions(deviceId, topicId);
  }

  @Get('practice/question/:questionId')
  getQuestionDetail(
    @Headers('x-device-id') deviceId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.practiceService.getQuestionDetail(deviceId, questionId);
  }

  @Post('practice/action')
  recordAction(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: PracticeActionDto,
  ) {
    return this.practiceService.recordAction(deviceId, dto);
  }

  @Get('dictionary/lookup')
  lookupDictionary(@Query('term') term: string) {
    return this.practiceService.lookupDictionary(term);
  }
}
