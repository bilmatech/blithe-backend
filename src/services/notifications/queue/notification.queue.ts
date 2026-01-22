import { VerificationTemplateModel } from '@Blithe/services/email/email.types';

export const NotificationQueue = 'notification-queue';

export const enum QueueNames {
  EMAIL_QUEUE = 'email-queue',
  NOTIFICATION_QUEUE = 'notification-queue',
}

// Add more data types as needed
type EmailDataTypes = VerificationTemplateModel;

export type NotificationJobData<T = any> = {
  type: T;
  payload: EmailDataTypes;
};

export enum NotificationType {
  AccountVerification = 'account_verification',
  ForgotPassword = 'forgot_password',
}
