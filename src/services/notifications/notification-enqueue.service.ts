import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  NotificationJobData,
  NotificationQueue,
  QueueNames,
} from './queue/notification.queue';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class NotificationEnqueueService {
  constructor(
    @InjectQueue(NotificationQueue)
    private readonly queueSvc: Queue<NotificationJobData>,
  ) {}

  async enqueueNotificationJob<T = any>(
    jobName: QueueNames,
    data: NotificationJobData<T>,
    opts?: any,
  ): Promise<void> {
    await this.queueSvc.add(jobName, data, opts);
  }
}
