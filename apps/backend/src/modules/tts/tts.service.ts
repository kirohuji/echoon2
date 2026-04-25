import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { TtsProvider } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TtsProviderFactory } from './tts-provider.factory';
import { TTS_PARAMS_SCHEMA, sanitizeTtsParams } from './tts-params.schema';
import { SynthesizeQuestionDto, SynthesizeTextDto } from './dto/synthesize.dto';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly audioDir = path.join(process.cwd(), 'uploads', 'tts-audios');

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: TtsProviderFactory,
  ) {}

  getParamsSchema() {
    return TTS_PARAMS_SCHEMA;
  }

  /** 题目音频：按 (questionId + 配置哈希) 持久化缓存 */
  async synthesizeQuestion(dto: SynthesizeQuestionDto) {
    const question = await this.prisma.questionItem.findUnique({
      where: { id: dto.questionId },
      include: { content: true },
    });
    if (!question) throw new NotFoundException('题目不存在');
    if (!question.content) throw new BadRequestException('题目暂无内容');

    // 英文答案 + 问题拼接作为语音文本
    const text = question.content.answerEn?.trim() || question.content.promptEn?.trim();
    if (!text) throw new BadRequestException('题目英文内容为空');

    const configHash = this.buildConfigHash(dto.provider, dto.model, dto.voiceId, dto.params);

    // 检查缓存
    const existing = await this.prisma.questionAudio.findUnique({
      where: { questionId_configHash: { questionId: dto.questionId, configHash } },
    });
    if (existing) {
      this.logger.log(`Cache hit: questionId=${dto.questionId} provider=${dto.provider}`);
      return {
        id: existing.id,
        mimeType: existing.mimeType,
        wordTimestamps: existing.wordTimestamps,
        cached: true,
      };
    }

    // 生成新音频
    await fs.mkdir(this.audioDir, { recursive: true });
    const sanitizedParams = sanitizeTtsParams(dto.provider, dto.model, dto.params);
    const provider = this.factory.getProvider(dto.provider);
    const ephemeralId = `q-${dto.questionId}-${randomUUID()}`;

    this.logger.log(`Generating TTS: questionId=${dto.questionId} provider=${dto.provider} model=${dto.model}`);
    const result = await provider.generateAudio({
      id: ephemeralId,
      text,
      model: dto.model,
      voiceId: dto.voiceId,
      params: sanitizedParams,
    });

    const fileName = `${ephemeralId}.${result.fileExtension}`;
    const audioPath = path.join(this.audioDir, fileName);
    await fs.writeFile(audioPath, result.audioBuffer);

    const record = await this.prisma.questionAudio.create({
      data: {
        questionId: dto.questionId,
        configHash,
        provider: dto.provider as TtsProvider,
        model: dto.model,
        voiceId: dto.voiceId ?? null,
        mimeType: result.mimeType,
        audioPath,
        wordTimestamps: result.wordTimestamps as any ?? undefined,
      },
    });

    return {
      id: record.id,
      mimeType: record.mimeType,
      wordTimestamps: record.wordTimestamps,
      cached: false,
    };
  }

  /** 短文本即时合成（不持久化），用于前端预览测试 */
  async synthesizeText(dto: SynthesizeTextDto) {
    const sanitizedParams = sanitizeTtsParams(dto.provider, dto.model, dto.params);
    const provider = this.factory.getProvider(dto.provider);
    const result = await provider.generateAudio({
      id: `ephemeral-${randomUUID()}`,
      text: dto.text.trim(),
      model: dto.model,
      voiceId: dto.voiceId,
      params: sanitizedParams,
    });
    return {
      mimeType: result.mimeType,
      audioBase64: result.audioBuffer.toString('base64'),
      wordTimestamps: result.wordTimestamps,
    };
  }

  async getAudioFile(id: string) {
    const record = await this.prisma.questionAudio.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('音频不存在');
    return { audioPath: record.audioPath, mimeType: record.mimeType };
  }

  /** 删除某题目的所有缓存音频（TTS 配置变更时调用） */
  async clearQuestionAudioCache(questionId: string) {
    const records = await this.prisma.questionAudio.findMany({ where: { questionId } });
    await Promise.all(
      records.map((r) => fs.unlink(r.audioPath).catch(() => undefined)),
    );
    await this.prisma.questionAudio.deleteMany({ where: { questionId } });
    return { deleted: records.length };
  }

  private buildConfigHash(
    provider: string,
    model: string,
    voiceId?: string,
    params?: Record<string, unknown>,
  ): string {
    const key = JSON.stringify({
      provider,
      model,
      voiceId: voiceId ?? null,
      params: params ? JSON.stringify(Object.keys(params).sort().reduce((acc, k) => ({ ...acc, [k]: params[k] }), {})) : null,
    });
    return createHash('sha1').update(key).digest('hex');
  }
}
