import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '健康检查端点' })
  check() {
    return this.healthService.check();
  }
}
