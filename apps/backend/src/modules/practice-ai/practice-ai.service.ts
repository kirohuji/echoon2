import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GetFeedbackDto } from './dto/get-feedback.dto';

export type AiFeedback = {
  score: number;           // 0–100
  level: string;           // Excellent / Good / Fair / Needs Work
  summary: string;         // 一句话总体评价
  strengths: string[];     // 优点列表
  improvements: string[];  // 改进点列表
  languageNotes: string[]; // 语言使用建议（词汇、语法）
  pronunciationNotes: string[] | null; // 发音建议（仅语音作答）
  revisedAnswer: string;   // 参考改进版本
  keywordsUsed: string[];  // 用户用到了哪些关键词
  keywordsMissed: string[]; // 遗漏的关键词
};

const LEVEL_MAP: Record<string, string> = {
  excellent: '优秀', good: '良好', fair: '一般', 'needs work': '需要练习',
};

@Injectable()
export class PracticeAiService {
  private readonly logger = new Logger(PracticeAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFeedback(dto: GetFeedbackDto): Promise<AiFeedback> {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) throw new BadRequestException('未配置 DEEPSEEK_API_KEY，无法使用 AI 评分功能');

    const question = await this.prisma.questionItem.findUnique({
      where: { id: dto.questionId },
      include: { content: true },
    });
    if (!question) throw new NotFoundException('题目不存在');

    const questionText = question.content?.promptEn ?? question.title;
    const referenceAnswer = question.content?.answerEn ?? '';
    const keywords = question.keywords ?? [];

    const systemPrompt = `You are an expert English language tutor and tour guide exam coach. 
Evaluate the student's answer to a tour guide oral exam question. 
Respond ONLY with a valid JSON object matching the specified schema.
Be constructive, specific, and encouraging.`;

    const userPrompt = `Question: "${questionText}"
Reference Answer: "${referenceAnswer}"
Key Points to Cover: ${keywords.length ? keywords.join(', ') : '(none specified)'}
Student's Answer: "${dto.userAnswer}"

Evaluate the student's answer and respond with this exact JSON schema:
{
  "score": <integer 0-100>,
  "level": <"excellent"|"good"|"fair"|"needs work">,
  "summary": "<one sentence overall assessment in Chinese>",
  "strengths": ["<strength 1 in Chinese>", ...],
  "improvements": ["<improvement 1 in Chinese>", ...],
  "languageNotes": ["<language note 1 in Chinese>", ...],
  "pronunciationNotes": ${dto.isVoice ? '["<pronunciation note 1 in Chinese>", ...]' : 'null'},
  "revisedAnswer": "<improved English answer>",
  "keywordsUsed": ["<keyword found in answer>", ...],
  "keywordsMissed": ["<keyword not found in answer>", ...]
}

Scoring guide: 90-100 excellent, 75-89 good, 60-74 fair, below 60 needs work.`;

    try {
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const raw = response.data?.choices?.[0]?.message?.content;
      if (!raw) throw new Error('AI returned empty response');

      const parsed = JSON.parse(raw) as AiFeedback;

      // 规范化 level
      const levelKey = (parsed.level ?? '').toLowerCase();
      parsed.level = LEVEL_MAP[levelKey] ?? parsed.level ?? '未知';

      // 确保数组字段不为空
      parsed.strengths      = Array.isArray(parsed.strengths)      ? parsed.strengths      : [];
      parsed.improvements   = Array.isArray(parsed.improvements)   ? parsed.improvements   : [];
      parsed.languageNotes  = Array.isArray(parsed.languageNotes)  ? parsed.languageNotes  : [];
      parsed.keywordsUsed   = Array.isArray(parsed.keywordsUsed)   ? parsed.keywordsUsed   : [];
      parsed.keywordsMissed = Array.isArray(parsed.keywordsMissed) ? parsed.keywordsMissed : [];

      return parsed;
    } catch (e: any) {
      this.logger.error(`AI feedback failed: ${e.message}`);
      throw new BadRequestException(`AI 评分失败：${e.message}`);
    }
  }
}
