import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetFeedbackDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  /** 用户作答文本 */
  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  /** 是否为语音作答（影响是否提供发音反馈） */
  @IsOptional()
  isVoice?: boolean;
}
