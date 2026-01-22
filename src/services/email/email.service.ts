import { Injectable } from '@nestjs/common';
import { ResendService } from './providers/resend.service';
import { EmailTypes, VerificationTemplateModel } from './email.types';

@Injectable()
export class EmailService {
  constructor(private readonly resendSvc: ResendService) {}

  sendAccountVerificationEmail(to: string, code: string) {
    const title = 'Verify your account';
    const message =
      'Thank you for starting your journey with us! Please use the following code to verify your account:';
    return this.sendVerificationCode(to, code, title, message);
  }

  sendPasswordResetEmail(to: string, code: string) {
    const title = 'Reset your password';
    const message =
      'We received a request to reset your password. Please use the following code to proceed:';
    return this.sendVerificationCode(to, code, title, message);
  }

  private sendVerificationCode(
    to: string,
    code: string,
    title: string,
    message: string,
  ) {
    return this.resendSvc.send<VerificationTemplateModel>(
      {
        to,
        title,
        message,
        code,
      },
      EmailTypes.verification,
    );
  }
}
