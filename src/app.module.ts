import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailProvidersModule } from './services/email/providers/email-providers.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmailProvidersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
