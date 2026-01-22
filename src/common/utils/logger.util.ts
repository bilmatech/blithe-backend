import * as Sentry from '@sentry/nestjs';

export class AppLogger {
  static log(message: string, ...optionalParams: any[]) {
    Sentry.captureMessage(message, {
      level: 'info',
      extra: { optionalParams },
    });
  }

  static error(error: unknown) {
    Sentry.captureException(error);
  }

  static warn(message: string, ...optionalParams: any[]) {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: { optionalParams },
    });
  }

  static debug(message: string, ...optionalParams: any[]) {
    Sentry.captureMessage(message, {
      level: 'debug',
      extra: { optionalParams },
    });
  }
}
