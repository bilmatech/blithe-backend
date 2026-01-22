import { Credential, Profile, User } from '@DB/Client';

export interface AuthUser extends User {
  credential?: Credential;
  profile?: Profile;
}

export enum AuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export enum AuthChallengeType {
  APP_PIN = 'pin_challenge',
}
