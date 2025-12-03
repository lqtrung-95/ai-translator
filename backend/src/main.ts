import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 统一 API 前缀
  app.setGlobalPrefix('api');

  // 启用 CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('AI 文档翻译平台 API')
    .setDescription('云文档 AI 翻译平台的后端 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3001/api', 'Development')
    .addServer('https://api.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  
  // Enable graceful shutdown hooks
  app.enableShutdownHooks();
  
  await app.listen(port, 'localhost');

  console.log(`✅ Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
