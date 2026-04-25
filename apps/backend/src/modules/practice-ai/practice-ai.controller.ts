import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PracticeAiService } from './practice-ai.service';
import { GetFeedbackDto, GetTeachingDto } from './dto/get-feedback.dto';

@Controller('practice-ai')
export class PracticeAiController {
  constructor(private readonly service: PracticeAiService) {}

  /** 流式 AI 评分反馈（text/event-stream → markdown 文本流） */
  @Post('feedback')
  async streamFeedback(@Body() dto: GetFeedbackDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    await this.service.streamFeedback(dto, res as any);
  }

  /** 流式 AI 教学指导（text/event-stream → markdown 文本流） */
  @Post('teach')
  async streamTeaching(@Body() dto: GetTeachingDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    await this.service.streamTeaching(dto, res as any);
  }
}
