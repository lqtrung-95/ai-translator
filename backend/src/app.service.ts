import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to AI Document Translation Platform API';
  }

  getStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
