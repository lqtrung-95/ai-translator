import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class InstantTranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsIn(['professional', 'casual', 'summary'])
  mode?: 'professional' | 'casual' | 'summary';

  @IsOptional()
  @IsIn(['gemini', 'claude', 'openai'])
  provider?: 'gemini' | 'claude' | 'openai';

  @IsOptional()
  @IsString()
  context?: string;
}
