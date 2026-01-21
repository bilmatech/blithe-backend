import { Inject, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigType } from '@nestjs/config';
import emailConfig from '../config/email.config';
import { TemplateParserService } from '../template-parser/template-parser.service';
import { TemplateModel } from './postmark.types';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { maskEmail } from '@Blithe/common/utils/funcs.util';

@Injectable()
export class ResendService extends Resend {
  constructor(
    @Inject(emailConfig.KEY)
    private readonly _emailConfig: ConfigType<typeof emailConfig>,
    private readonly templateEngineSvc: TemplateParserService,
  ) {
    if (!_emailConfig.resendApiKey) {
      throw new Error(
        'Resend API key is not defined in environment variables and is required to send emails',
      );
    }
    super(_emailConfig.resendApiKey);
  }

  /**
   * Send an email using a Postmark template to recipient.
   * @param data - Data required to send a welcome email
   * @returns The response from Postmark after attempting to send the email
   */
  async send<T = any>(data: TemplateModel<T>, eventType: any) {
    let html: string;
    let subject: string;

    // parse the date variable for the layout variable in the templates.
    data['date'] = new Date().getFullYear().toString();

    switch (eventType) {
      case 'userCreated':
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.welcome.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.welcome.subject;
        break;

      case 'userFollowUp':
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.followUp.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.followUp.subject;
        break;

      //  All verification emails to use the verificatiom template.
      case 'deviceVerification':
        // update the sender signature to security sender signature:
        // The signature is <sometext@domain.com>, our goal is to have sometext replaced with <security@domain.com>
        // while keeping the domain part same as in the original sender signature.
        // NOTE: This replacement is done here to avoid changing it globally for other email types and the < and > must be replace or preserved accordingly.
        this._emailConfig.senderSignature =
          this._emailConfig.senderSignature.replace(
            '<notifications',
            '<security',
          );

        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.verification.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.verification.subject;
        break;

      case 'creditAlert':
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.creditAlert.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.creditAlert.subject;
        break;
      default:
        throw new AppError(`Unsupported event type: ${eventType}`);
    }

    if (!html || !subject) {
      throw new AppError(
        `Email template ID for event ${eventType} is not configured`,
      );
    }

    const isSent = await this.emails.send({
      to: data.to,
      subject,
      from: this._emailConfig.senderSignature,
      html,
    });

    if (isSent.error) {
      throw new AppError(
        `Failed to resend email to recipient ${maskEmail(data.to)}. Reason: ${isSent.error.message}; Name: ${isSent.error.name}; StatusCode: ${isSent.error.statusCode}`,
      );
    }

    return isSent.data.id;
  }
}
