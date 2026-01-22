export enum NotificationType {
  /** Email notifications */
  EMAIL = 'email',
  /** Push notifications */
  PUSH = 'push',
  /** In-app notifications */
  IN_APP = 'in_app',
}

export type WelcomeEmailNotificationPayload = {
  to: string;
  name: string;
  title: string;
  body: string;
};

export type UserCreatedNotificationPayload = {
  to: WelcomeEmailNotificationPayload['to'];
  name: WelcomeEmailNotificationPayload['name'];
};

export type CreditAlertEmailNotificationPayload = {
  to: string;
  title: string;
  amount: number;
  name: string;
};

export type UserInactiveNotificationPayload = {
  to: string;
  name: string;
  title: string;
  body: string;
};

type TransactionProps = {
  fromDetails?: {
    name: string;
    accountNumber: string;
    bankName: string;
  };
  toDetails?: {
    name: string;
    accountNumber: string;
    bankName: string;
  };

  items: Array<{
    itemName: string;
    itemValue: string;
  }>;
};

export type SuccessfulTransactionEmailNotificationPayload = TransactionProps & {
  to: string;
  title: string;
  body: string;
};

export type FailedTransactionEmailNotificationPayload = TransactionProps & {
  to: string;
  title: string;
  body: string;
};

export type ReversedTransactionEmailNotificationPayload = TransactionProps & {
  to: string;
  title: string;
  body: string;
};

export type FunnelsAlertEmailNotificationPayload = TransactionProps & {
  to: string;
  title: string;
  body: string;
};

export type FunnelsReportEmailNotificationPayload = TransactionProps & {
  to: string;
  title: string;
  body: string;
};

export enum NotificationEvents {
  userCreated = 'user.created',
  creditAlert = 'wallet.credit_alert',
  userFollowUp = 'user.follow_up',
  transactionSuccessful = 'transactions.successful',
  failedTransaction = 'transactions.failed',
  reversedTransaction = 'transactions.reversed',
  deviceVerification = 'device.verification',
  funnelsAlert = 'funnels.alert',
  funnelsReport = 'funnels.report',
}

export type NotificationProcessorJobPayload = {
  event: NotificationEvents;
  type: NotificationType;
  data:
    | UserCreatedNotificationPayload
    | CreditAlertEmailNotificationPayload
    | UserInactiveNotificationPayload
    | SuccessfulTransactionEmailNotificationPayload
    | FailedTransactionEmailNotificationPayload
    | ReversedTransactionEmailNotificationPayload
    | FunnelsAlertEmailNotificationPayload
    | FunnelsReportEmailNotificationPayload;
};
