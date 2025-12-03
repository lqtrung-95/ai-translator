import { Module } from '@nestjs/common';
import { InstantTranslationController } from './instant-translation.controller';
import { InstantTranslationService } from './instant-translation.service';
import { AITranslationService } from '../translation/services/ai-translation.service';
import { ConfigModule } from '@nestjs/config';
import { GlossaryModule } from '../glossary/glossary.module';

@Module({
  imports: [ConfigModule, GlossaryModule],
  controllers: [InstantTranslationController],
  providers: [InstantTranslationService, AITranslationService],
})
export class InstantTranslationModule {}
