export class CreateVerificationDto {
  userId: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  desc?: string;
}
