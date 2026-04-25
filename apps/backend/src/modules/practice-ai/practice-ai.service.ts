import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetFeedbackDto, GetTeachingDto } from './dto/get-feedback.dto';

@Injectable()
export class PracticeAiService {
  private readonly logger = new Logger(PracticeAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async loadQuestion(questionId: string) {
    const q = await this.prisma.questionItem.findUnique({
      where: { id: questionId },
      include: { content: true },
    });
    if (!q) throw new NotFoundException('题目不存在');
    return q;
  }

  private getProvider() {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) throw new BadRequestException('未配置 DEEPSEEK_API_KEY');
    return createOpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' });
  }

  /** 将 AI SDK textStream 手动 pipe 到 Express Response */
  private async pipeStream(
    textStream: AsyncIterable<string>,
    res: Response,
  ) {
    for await (const chunk of textStream) {
      if (!res.writableEnded) {
        res.write(chunk);
      }
    }
    if (!res.writableEnded) {
      res.end();
    }
  }

  // ======================================================
  // 1. 作答评分（streaming text/plain）
  // ======================================================
  async streamFeedback(dto: GetFeedbackDto, res: Response) {
    const q = await this.loadQuestion(dto.questionId);
    const provider = this.getProvider();

    const questionText    = (q as any).content?.promptEn ?? (q as any).title ?? '';
    const referenceAnswer = (q as any).content?.answerEn ?? '';
    const keywords        = (q as any).keywords ?? [];

    const systemPrompt = `You are an expert English language coach and Chinese tour guide exam trainer.
Your role is to give detailed, constructive, and encouraging feedback on student answers.
Always respond in Chinese. Be specific, warm, and actionable.
Structure your response with clear sections using markdown headings and bullet points.`;

    const userPrompt = `## 题目
${questionText}

## 参考答案
${referenceAnswer}

## 关键词要点
${keywords.length ? keywords.join('、') : '无'}

## 学生作答
${dto.userAnswer}
${dto.isVoice ? '\n（以上为语音录音转写文本，请额外关注表达流畅度和语言自然度）' : ''}

请按以下结构给出详细反馈：

### 📊 综合评分
给出 0-100 分并说明理由（一句话）。

### ✅ 做得好的地方
列出 2-3 个具体优点。

### 🎯 可以改进的地方
列出 2-3 个具体改进点，每点给出如何改进的建议。

### 💡 语言表达建议
针对词汇、语法或句式给出 1-2 条具体建议，附上改进示例。
${dto.isVoice ? '\n### 🎙️ 发音与流畅度\n根据转写文本判断可能的发音或流畅度问题并给出建议。' : ''}

### 📝 关键词覆盖
指出哪些关键词用到了，哪些遗漏了，遗漏的应如何融入答案。

### ✨ 改进版本
给出一个完整的参考改进版英文答案（100-150词）。`;

    const result = streamText({
      model: provider('deepseek-chat'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
      maxOutputTokens: 1200,
    });

    await this.pipeStream(result.textStream, res);
  }

  // ======================================================
  // 2. 教学指导（streaming + tools）
  // ======================================================
  async streamTeaching(dto: GetTeachingDto, res: Response) {
    const q = await this.loadQuestion(dto.questionId);
    const provider = this.getProvider();

    const questionText    = (q as any).content?.promptEn ?? (q as any).title ?? '';
    const keywords        = (q as any).keywords ?? [];
    const focusWords      = (q as any).focusWords ?? [];

    const systemPrompt = `You are a warm, patient, and deeply knowledgeable English tutor specializing in Chinese tour guide oral exams.
Your teaching style:
- Never give the full answer directly — guide through hints and questions
- Explain WHY things work (grammar logic, cultural context)
- Use concrete examples from everyday English
- Break complex answers into manageable building blocks
- Celebrate small wins and progress
Always respond in Chinese. Use markdown for clear structure.`;

    const userPrompt = `## 题目
${questionText}

## 学生草稿
${dto.userDraft?.trim() || '（学生尚未开始作答）'}

## 需要覆盖的要点
关键词：${keywords.length ? keywords.join('、') : '无'}
重点词汇：${focusWords.length ? focusWords.join('、') : '无'}

请扮演一位贴心的英语老师，为学生提供**学习指导**（不是直接给答案）：

### 🧭 审题指引
帮助学生理解题目在问什么，应该从哪些角度回答。

### 📚 知识点梳理
列出回答这道题需要了解的 2-3 个**关键知识点或文化背景**（中英文对照）。

### 🔤 句型结构建议
推荐 2-3 个适合这道题的**英文句型框架**，附中文说明和填空示例。

### 💬 词汇提示
列出 4-6 个**建议使用的词汇或短语**，附词性、中文意思和例句。

### ✍️ 第一步提示
给出构建答案的第一个具体步骤或提示句，引导学生开始动笔。`;

    const result = streamText({
      model: provider('deepseek-chat'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
      maxOutputTokens: 1000,
    });

    await this.pipeStream(result.textStream, res);
  }
}
