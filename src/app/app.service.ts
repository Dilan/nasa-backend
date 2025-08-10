import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion(): string {
    return process.env.VERSION || 'default-1.0.0';
  }
}
