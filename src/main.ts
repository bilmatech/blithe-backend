import '@Blithe/instrument';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@Blithe/common/filters/http-exception.filter';
import { ResponseInterceptor } from '@Blithe/common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { Queue } from 'bullmq';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import * as basicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NotificationQueue } from './services/notifications/queue/notification.queue';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Initailize global validations
   */
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist all properties that are not define in request
      whitelist: true,
      // Throws an error when a property not define in request body is provided by user
      forbidNonWhitelisted: true,
      // Transform the incoming request into the instance of a DTO Class.
      transform: true,
    }),
  );

  // Enable CORS for all origins
  app.enableCors({
    origin: true, // allows all origins
    credentials: true,
  });

  // Set global prefix for API routes
  app.setGlobalPrefix('api/v1');

  // interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // exception filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // ============== [ Swagger Documentation ] ==============

  /**
   * Swagger documentation setup
   */
  const config = new DocumentBuilder()
    .setTitle('Blithe Associate Technologies')
    .setDescription('BlithePay Backends API Documentation')
    .setVersion('1.0')
    .setContact(
      'Blithe Associate Technologies',
      'https://blitheassociates.com',
      'tech@blitheassociates.com',
    )

    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ================== [End Swagger Documentation ] ==================

  // ============== [ Bull Queue ] ==============

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/queues');

  // Register BullMQ Queues
  const notificationQueue = app.get<Queue>(`BullQueue_${NotificationQueue}`); // queue name prefixed

  createBullBoard({
    options: {
      // Configure Bull Board compilerOptions
    },
    queues: [new BullMQAdapter(notificationQueue)],
    serverAdapter,
  });

  // Let's protect our admin panel behind basic auth
  const username = process.env.BULL_BOARD_USER || 'admin';
  const password = process.env.BULL_BOARD_PASSWORD || 'supersecret';

  app.use(
    '/queues',
    // basicAuth({
    //   users: { [username]: password }, // username:password
    //   challenge: true,
    // }),
    serverAdapter.getRouter(),
  );

  // ============== [ End ] ==============

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
