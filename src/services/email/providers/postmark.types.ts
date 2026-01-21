export type TemplateModel<T = any> = {
  to: string;
  [key: string]: T | string;
};
export type WelcomeTemplateModel = {
  to: string;
  title: string;
  message: string;
};

export type UserInactiveTemplateModel = WelcomeTemplateModel;

export type VerificationTemplateModel = {
  to: string;
  title: string;
  message: string;
  code: string;
  date: string;
};

export type CreditAlertTemplateModel = {
  to: string;
  title: string;
  message: string;
  date: string;
};
