import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PracticeAiService } from './practice-ai.service';
import { GetFeedbackDto } from './dto/get-feedback.dto';

@Controller('practice-ai')
export class PracticeAiController {
  constructor(private readonly practiceAiService: PracticeAiService) {}

  /**
   * 提交用户作答，获取 AI 结构化评分反馈。
   * 支持文字作答和语音转文字作答，isVoice=true 时额外生成发音建议。
   */
  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  getFeedback(@Body() dto: GetFeedbackDto) {
    return this.practiceAiService.getFeedback(dto);
  }
}
