import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTranslationDto, UpdateTranslationDto, TranslateDocumentDto } from './dto/translation.dto';

@ApiTags('文档翻译')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  @ApiOperation({ summary: '创建翻译任务' })
  async create(@Request() req: any, @Body() dto: CreateTranslationDto) {
    return this.translationService.createTranslation(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户的翻译列表' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  async getUserDocuments(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0
  ) {
    return this.translationService.getUserDocuments(req.user.id, limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取翻译文档详情' })
  async getDocument(@Param('id') id: string, @Request() req: any) {
    return this.translationService.getDocument(id, req.user.id);
  }

  @Post(':id/translate')
  @ApiOperation({ summary: '翻译文档' })
  async translateDocument(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: TranslateDocumentDto
  ) {
    return this.translationService.translateDocument(
      id,
      req.user.id,
      dto.mode || 'professional',
      dto.provider || 'gemini'
    );
  }

  @Get(':documentId/paragraphs/:paragraphId')
  @ApiOperation({ summary: '获取段落详情' })
  async getParagraph(
    @Param('documentId') documentId: string,
    @Param('paragraphId') paragraphId: string,
    @Request() req: any
  ) {
    const document = await this.translationService.getDocument(documentId, req.user.id);
    const paragraph = document.paragraphs.find((p) => p.id === paragraphId);
    if (!paragraph) {
      throw new Error('Paragraph not found');
    }
    return paragraph;
  }

  @Put(':documentId/paragraphs/:paragraphId')
  @ApiOperation({ summary: '更新段落翻译' })
  async updateParagraph(
    @Param('documentId') documentId: string,
    @Param('paragraphId') paragraphId: string,
    @Request() req: any,
    @Body() dto: UpdateTranslationDto
  ) {
    return this.translationService.updateTranslation(
      documentId,
      paragraphId,
      dto,
      req.user.id
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除翻译文档' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.translationService.deleteDocument(id, req.user.id);
    return { message: 'Document deleted successfully' };
  }
}
