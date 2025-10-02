import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FirebaseProvider } from './firebase.provider';
import { WebPushProvider } from './webpush.provider';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseProvider, WebPushProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
