import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'node:fs';
import { TtsService } from './tts.service';
import { SynthesizeQuestionDto, SynthesizeTextDto } from './dto/synthesize.dto';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  /** 获取所有支持的 Provider/Model/参数 schema */
  @Get('params-schema')
  getParamsSchema() {
    return this.ttsService.getParamsSchema();
  }

  /** 根据题目 ID + TTS 配置生成/获取持久化音频 */
  @Post('synthesize-question')
  @HttpCode(HttpStatus.OK)
  synthesizeQuestion(@Body() dto: SynthesizeQuestionDto) {
    if (!dto.questionId?.trim()) throw new BadRequestException('questionId 不能为空');
    return this.ttsService.synthesizeQuestion(dto);
  }

  /** 短文本即时预听（不缓存，仅用于设置页预览） */
  @Post('synthesize-text')
  @HttpCode(HttpStatus.OK)
  synthesizeText(@Body() dto: SynthesizeTextDto) {
    return this.ttsService.synthesizeText(dto);
  }

  /** 流式返回已缓存的音频文件 */
  @Get('audio/:id')
  async getAudio(@Param('id') id: string, @Res() res: Response) {
    const { audioPath, mimeType } = await this.ttsService.getAudioFile(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    const stat = fs.statSync(audioPath);
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
  }

  /** 清除指定题目的全部音频缓存 */
  @Delete('question/:questionId/cache')
  clearCache(@Param('questionId') questionId: string) {
    return this.ttsService.clearQuestionAudioCache(questionId);
  }
}
