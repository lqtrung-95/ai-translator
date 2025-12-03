import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { AITranslationService } from './services/ai-translation.service';
import { DocumentParserService } from '../document/services/document-parser.service';
import { TranslationDocument } from './entities/translation-document.entity';
import { TranslationParagraph } from './entities/translation-paragraph.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TranslationDocument, TranslationParagraph])],
  controllers: [TranslationController],
  providers: [TranslationService, AITranslationService, DocumentParserService],
  exports: [TranslationService],
})
export class TranslationModule {}
