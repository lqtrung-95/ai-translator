import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { InstantTranslationModule } from './modules/instant-translation/instant-translation.module';
import { GlossaryModule } from './modules/glossary/glossary.module';
import { TranslationModule } from './modules/translation/translation.module';
import { UserModule } from './modules/user/user.module';

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

    // TypeORM - Supabase PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get('SUPABASE_DB_URL');
        
        // If Supabase URL is provided, use it directly
        if (supabaseUrl) {
          return {
            type: 'postgres',
            url: supabaseUrl,
            autoLoadEntities: true,
            synchronize: configService.get('NODE_ENV') !== 'production', // Auto-create tables in dev
            ssl: { rejectUnauthorized: false },
            logging: configService.get('NODE_ENV') === 'development',
          };
        }
        
        // Fallback to individual config (for local Docker PostgreSQL)
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'ai_translator'),
          autoLoadEntities: true,
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
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

    // 业务模块
    AuthModule,
    HealthModule,
    InstantTranslationModule,
    GlossaryModule,
    UserModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
