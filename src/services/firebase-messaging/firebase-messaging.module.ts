import { Module } from '@nestjs/common';
import { FirebaseMessagingService } from './firebase-messaging.service';
import { DatabaseModule } from '@Blithe/database/database.module';
import { FirebaseModule } from '@Blithe/common/firebase/firebase.module';

@Module({
  imports: [DatabaseModule, FirebaseModule],
  providers: [FirebaseMessagingService],
  exports: [FirebaseMessagingService],
})
export class FirebaseMessagingModule {}
