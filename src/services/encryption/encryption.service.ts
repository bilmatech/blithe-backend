import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import encryptionConfig from './encryption.config';
import { decryptText, encryptText } from '@Blithe/common/utils/encrypter';

@Injectable()
export class EncryptionService {
  constructor(
    @Inject(encryptionConfig.KEY)
    private readonly config: ConfigType<typeof encryptionConfig>,
  ) {}

  /**
   * Encrypts the given text using the configured encryption key.
   * @param text The plaintext to encrypt.
   * @returns The encrypted text.
   */
  encrypt(text: string): string {
    return encryptText(text, this.config.key);
  }

  /**
   * Decrypts the given text using the configured encryption key.
   * @param text The encrypted text to decrypt.
   * @returns The decrypted plaintext.
   */
  decrypt(text: string): string {
    return decryptText(text, this.config.key);
  }
}
