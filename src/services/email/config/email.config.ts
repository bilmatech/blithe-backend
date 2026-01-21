import { registerAs } from '@nestjs/config';

export default registerAs('emailConfig', () => ({
  // Sender signature
  senderSignature: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
  // Postmark API key
  postmarkApiKey: process.env.POSTMARK_API_KEY,
  // Resend API key
  resendApiKey: process.env.RESEND_API_KEY,

  // Postmark email template IDs
  welcomeTemplate: 41677218, // Welcome email template ID
  fundingNotificationTemplate: 41677238, // Funding notification email template ID
  userFollowUpTemplate: 41677341, // User follow-up email template ID
  transactionSuccessfulTemplate: 41677504, // Transaction successful email template ID
  transactionFailedTemplate: 41716083, // Transaction failed email template ID
  transactionReversedTemplate: 41716070, // Transaction reversed email template ID
  verificationTemplate: 41673943, // Verification email template ID
  funnelsProcessingCompleteTemplate: 41711155, // Funnels processing complete email template ID
  funnelsReportTemplate: 41711160, // Funnels report email template ID,

  // Resend email template configs
  resendTemplates: {
    welcome: {
      path: 'emails/welcome.html',
      subject: '🎉 Welcome to SabiFlow! Your Financial Clarity Starts Now ✨',
    },
    followUp: {
      path: 'emails/follow-up.html',
      subject: '🥹 I miss you! Just checking up on you.',
    },
    verification: {
      path: 'emails/verification.html',
      subject: '🔑 Verification',
    },
    creditAlert: {
      path: 'emails/credit-alert.html',
      subject: "💰 You've got credit! Your account has been funded.",
    },
  },
}));
