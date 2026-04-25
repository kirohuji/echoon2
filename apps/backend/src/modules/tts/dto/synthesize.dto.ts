import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TtsProvider } from '@prisma/client';

export class SynthesizeQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsEnum(TtsProvider)
  provider: TtsProvider;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  params?: Record<string, unknown>;
}

export class SynthesizeTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(800)
  text: string;

  @IsEnum(TtsProvider)
  provider: TtsProvider;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  params?: Record<string, unknown>;
}
