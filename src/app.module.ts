import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere
      envFilePath: '.env', // default; adjust if you keep it elsewhere
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
