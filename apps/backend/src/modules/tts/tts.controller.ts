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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import * as fs from 'node:fs';
import { TtsService } from './tts.service';
import { SynthesizeQuestionDto, SynthesizeTextDto } from './dto/synthesize.dto';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Get('params-schema')
  getParamsSchema() {
    return this.ttsService.getParamsSchema();
  }

  @Post('synthesize-question')
  @HttpCode(HttpStatus.OK)
  synthesizeQuestion(@Body() dto: SynthesizeQuestionDto) {
    if (!dto.questionId?.trim()) throw new BadRequestException('questionId 不能为空');
    return this.ttsService.synthesizeQuestion(dto);
  }

  @Post('synthesize-text')
  @HttpCode(HttpStatus.OK)
  synthesizeText(@Body() dto: SynthesizeTextDto) {
    return this.ttsService.synthesizeText(dto);
  }

  @Get('audio/:id')
  async getAudio(@Param('id') id: string, @Res() res: Response) {
    const { audioPath, mimeType } = await this.ttsService.getAudioFile(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    const stat = fs.statSync(audioPath);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(audioPath).pipe(res);
  }

  /**
   * 上传用户录音 → Whisper 转写，返回文本 + 词时间戳。
   * 若未配置 WHISPER_INFERENCE_URL，仅返回音频 Base64（可供前端播放）。
   */
  @Post('transcribe-recording')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('audio', {
    storage: memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 50 }, // 50 MB
  }))
  async transcribeRecording(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未收到音频文件');
    return this.ttsService.transcribeRecording(file.buffer, file.originalname || 'recording.webm');
  }

  @Delete('question/:questionId/cache')
  clearCache(@Param('questionId') questionId: string) {
    return this.ttsService.clearQuestionAudioCache(questionId);
  }
}
