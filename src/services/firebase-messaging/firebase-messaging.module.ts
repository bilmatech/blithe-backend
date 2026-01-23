import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { DatabaseModule } from '@Blithe/services/database/database.module';
import { FirebaseAdminModule } from '@Blithe/common/firebase/firebase-admin.module';

@Module({
  imports: [FirebaseAdminModule],
  providers: [FirebaseMessagingService],
  exports: [FirebaseMessagingService],
})
export class FirebaseMessagingModule {}
