import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InstantTranslationService } from './instant-translation.service';
import { InstantTranslateDto } from './dto/instant-translation.dto';

@ApiTags('即时翻译')
@Controller('instant-translation')
export class InstantTranslationController {
  constructor(private readonly instantTranslationService: InstantTranslationService) {}

  @Post()
  @ApiOperation({ summary: '即时翻译文本（无需文档）' })
  async translate(@Body() dto: InstantTranslateDto) {
    const result = await this.instantTranslationService.translate({
      text: dto.text,
      mode: dto.mode,
      provider: dto.provider,
      context: dto.context,
      sourceLanguage: dto.sourceLanguage,
      targetLanguage: dto.targetLanguage,
    });

    return {
      translated: result.translated,
      confidence: result.confidence,
      provider: dto.provider || 'gemini',
    };
  }
}
