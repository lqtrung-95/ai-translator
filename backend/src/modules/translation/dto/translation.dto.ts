import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class CreateTranslationDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsIn(['url', 'pdf', 'html', 'markdown'])
  sourceFormat?: 'url' | 'pdf' | 'html' | 'markdown';

  @IsOptional()
  @IsArray()
  paragraphs?: Array<{
    type?: string;
    original: string;
    glossaryTerms?: Array<any>;
  }>;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTranslationDto {
  @IsOptional()
  @IsString()
  translated?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TranslateDocumentDto {
  @IsOptional()
  @IsIn(['professional', 'casual', 'summary'])
  mode?: 'professional' | 'casual' | 'summary';

  @IsOptional()
  @IsIn(['gemini', 'claude', 'openai'])
  provider?: 'gemini' | 'claude' | 'openai';
}
