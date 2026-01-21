import { Prisma, PrismaClient } from '@DB/Client';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import databaseConfig from './config/database.config';
import { ConfigType } from '@nestjs/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { EncryptionService } from '../encryption/encryption.service';

// Define the extended Prisma client type
type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;
export type PrismaTransaction = ExtendedPrismaClient;

function createExtendedClient(
  prisma: PrismaClient,
  encryptService: EncryptionService,
) {
  return prisma.$extends({
    name: 'EncryptedWalletBalance',
    query: {
      wallet: {
        create({ args, query }) {
          if (args.data.balance) {
            const balance = new Prisma.Decimal(args.data.balance)
              .toDecimalPlaces(2)
              .toString();
            args.data.balance = encryptService.encrypt(balance);
          }
          return query(args);
        },

        update({ args, query }) {
          if (args.data.balance) {
            const balance = new Prisma.Decimal(args.data.balance as string)
              .toDecimalPlaces(2)
              .toString();
            args.data.balance = encryptService.encrypt(balance);
          }

          return query(args);
        },

        updateMany({ args, query }) {
          if (args.data.balance) {
            const balance = new Prisma.Decimal(args.data.balance as string)
              .toDecimalPlaces(2)
              .toString();

            args.data.balance = encryptService.encrypt(balance);
          }
          return query(args);
        },

        async findFirst({ args, query }) {
          const result = await query(args);
          if (result?.balance) {
            result.balance = encryptService.decrypt(result.balance);
          }
          return result;
        },

        async findUnique({ args, query }) {
          const result = await query(args);
          if (result?.balance) {
            result.balance = encryptService.decrypt(result.balance);
          }
          return result;
        },

        async findMany({ args, query }) {
          const results = await query(args);
          if (Array.isArray(results)) {
            results.forEach((r) => {
              if (r.balance) {
                r.balance = encryptService.decrypt(r.balance);
              }
            });
          }
          return results;
        },
      },
    },
  });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // This will hold the extended Prisma instance with proper typing
  private prismaExtended!: ExtendedPrismaClient;

  constructor(
    private readonly encryptionService: EncryptionService,
    @Inject(databaseConfig.KEY)
    private readonly dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    const pgAdapter = new PrismaPg({ connectionString: dbConfig.url });
    super({ adapter: pgAdapter });
  }
  async onModuleInit() {
    await this.$connect();

    // Create extended client with pre/post encryption logic using the factory function
    this.prismaExtended = createExtendedClient(this, this.encryptionService);
  }

  /**
   * Helper getter to expose the extended client that handles middleware-like operations with proper typing
   */
  get ext(): ExtendedPrismaClient {
    return this.prismaExtended;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
