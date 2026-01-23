import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  accountDeletedMessage:
    'Sorry, your account has either been suspended, closed or deleted. Please contact customer support for further actions on your account.',
}));
