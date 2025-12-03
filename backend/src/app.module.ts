import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { InstantTranslationModule } from './modules/instant-translation/instant-translation.module';

// Controllers
import { AppController } from './app.controller';

// Services
import { AppService } from './app.service';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JWT 模块
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'test-secret-key-development'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '7d') },
      }),
    }),

    // 业务模块（不需要数据库的）
    AuthModule,
    HealthModule,
    InstantTranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
