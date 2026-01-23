import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { CreateApppinDto } from './dto/create-apppin.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@Blithe/services/database/prisma.service';

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  async setPin(userId: string, data: CreateApppinDto) {
    try {
      const userPin = await bcrypt.hash(data.pin.toString(), 10);
      const newPin = await this.prisma.credential.upsert({
        where: { userId },
        create: {
          userId,
          pinCode: userPin,
        },
        update: { pinCode: userPin, lastResetAt: new Date() },
      });
      if (!newPin) {
        throw new AppError('Failed to set app pin');
      }

      return { message: 'App pin set successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException('Internal server error', {
        cause: error,
      });
    }
  }

  async verifyPin(userId: string, pin: string) {
    const appPin = await this.prisma.credential.findUnique({
      where: { userId },
    });
    if (!appPin) {
      throw new AppError('App pin not found');
    }

    const isMatch = await bcrypt.compare(pin, String(appPin.pinCode));
    if (!isMatch) {
      throw new AppError('Invalid app pin');
    }

    // update last used at
    await this.prisma.credential.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    return appPin;
  }

  async hasPin(userId: string) {
    const appPin = await this.prisma.credential.findUnique({
      where: { userId },
      select: { id: true, userId: true, pinCode: true },
    });
    return !!appPin;
  }

  async setPassword(userId: string, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedCredential = await this.prisma.credential.upsert({
        where: { userId },
        create: {
          userId,
          password: hashedPassword,
        },
        update: { password: hashedPassword },
      });
      if (!updatedCredential) {
        throw new AppError('Failed to set password');
      }

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException('Internal server error', {
        cause: error,
      });
    }
  }

  async verifyPassword(userId: string, password: string) {
    const credential = await this.prisma.credential.findUnique({
      where: { userId },
    });
    if (!credential || !credential.password) {
      throw new AppError('Password not set for this user');
    }

    return await bcrypt.compare(password, String(credential.password));
  }
}
