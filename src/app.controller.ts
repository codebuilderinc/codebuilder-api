import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Api } from './common/decorators/api.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Api({ summary: 'Health / hello endpoint', description: 'Simple hello world response', envelope: true })
  getHello() {
    return { message: this.appService.getHello() };
  }
}
