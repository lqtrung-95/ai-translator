import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GlossaryService } from './glossary.service';

@ApiTags('术语库')
@Controller('glossary')
export class GlossaryController {
  constructor(private readonly glossaryService: GlossaryService) {}

  @Get()
  @ApiOperation({ summary: '获取术语列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(@Query('limit') limit = 100, @Query('offset') offset = 0) {
    return this.glossaryService.findAll(Number(limit), Number(offset));
  }

  @Get('search')
  @ApiOperation({ summary: '搜索术语' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') query: string) {
    return this.glossaryService.search(query);
  }

  @Post('custom')
  @ApiOperation({ summary: '添加自定义术语' })
  async create(@Body() term: any) {
    return this.glossaryService.create(term);
  }
}
