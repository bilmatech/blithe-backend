import { Credential, User } from '@DB/Client';

export interface AuthUser extends User {
  credential?: Credential;
}

export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export enum AuthChallengeType {
  APP_PIN = 'pin_challenge',
}
