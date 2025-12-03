import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@ApiTags('健康检查')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取问候信息' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: '获取服务状态' })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('config-check')
  @ApiOperation({ summary: '检查API配置状态' })
  checkConfig() {
    const geminiKey = this.configService.get('GEMINI_API_KEY');
    return {
      gemini: {
        configured: !!geminiKey,
        keyLength: geminiKey?.length || 0,
        keyPreview: geminiKey ? `${geminiKey.substring(0, 10)}...` : 'not set',
      },
    };
  }

  // 测试 API 端点 - 不需要数据库
  @Post('test/translate')
  @ApiOperation({ summary: '测试翻译端点（模拟）' })
  testTranslate(@Body() dto: any) {
    return {
      success: true,
      message: '翻译测试成功',
      original: dto.text || 'AWS VPC is a virtual network',
      translated: 'AWS VPC 是一个虚拟网络',
      mode: dto.mode || 'professional',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test/glossary')
  @ApiOperation({ summary: '测试术语库端点（模拟）' })
  testGlossary() {
    return {
      terms: [
        {
          id: '1',
          english: 'VPC',
          chinese: '虚拟私有云',
          category: 'infrastructure',
          explanation: 'Virtual Private Cloud 是云服务提供商提供的隔离网络环境',
        },
        {
          id: '2',
          english: 'IAM',
          chinese: '身份和访问管理',
          category: 'security',
          explanation: 'Identity and Access Management 用于管理用户权限和访问控制',
        },
      ],
      total: 2,
    };
  }
}
