import { Inject, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigType } from '@nestjs/config';
import emailConfig from '../configs/email.config';
import { TemplateParserService } from '../template-parser/template-parser.service';
import { EmailTypes, TemplateModel } from '../email.types';
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
  async send<T = any>(
    data: TemplateModel<T>,
    type: EmailTypes,
  ): Promise<string> {
    let html: string;
    let subject: string;

    // parse the date variable for the layout variable in the templates.
    data['date'] = new Date().getFullYear().toString();

    switch (type) {
      case EmailTypes.welcome:
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.welcome.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.welcome.subject;
        break;

      case EmailTypes.userInactive:
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.followUp.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.followUp.subject;
        break;

      //  All verification emails to use the verificatiom template.
      case EmailTypes.verification:
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.verification.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.verification.subject;
        break;

      case EmailTypes.creditAlert:
        html = await this.templateEngineSvc.render(
          this._emailConfig.resendTemplates.creditAlert.path,
          data,
        );
        subject = this._emailConfig.resendTemplates.creditAlert.subject;
        break;
      default:
        throw new AppError(`Unsupported email type. Received: ${type}`);
    }

    if (!html || !subject) {
      throw new AppError(
        `Email template ID for email ${type} is not configured`,
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
