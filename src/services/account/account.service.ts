import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { PaginationQueryDto } from '@Blithe/common/dto/pagination-query.dto';
import {
  buildPaginationArgs,
  getPaginationMetadata,
} from '@Blithe/common/utils/paginator.util';
import { PrismaService } from '@Blithe/services/database/prisma.service';
import { AccountStatus, UserType } from '@DB/Client';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user account.
   * @param createAccountDto The user account details
   * @param type The type of user account
   * @returns returns the newly created user object
   */
  async create(createAccountDto: CreateAccountDto, type: UserType) {
    try {
      const name = createAccountDto.fullName.split(' ');
      const firstName = name[0];
      const lastName = name.slice(1).join(' ');

      return await this.prisma.user.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: createAccountDto.email,
          profileImage: createAccountDto.profileImage,
          phone: createAccountDto.phone,
          accountStatus: AccountStatus.active,
          type,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Get all user accounts.
   * @param paginationQueryDto The pagination query dto
   * @returns The paginated user response.
   */
  async findAll(paginationQueryDto: PaginationQueryDto) {
    try {
      const [users, totalUsers] = await Promise.all([
        this.prisma.user.findMany({
          ...buildPaginationArgs(paginationQueryDto),
        }),
        this.prisma.user.count(),
      ]);
      return getPaginationMetadata(
        users,
        paginationQueryDto.page,
        paginationQueryDto.limit,
        totalUsers,
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Find a user by their ID
   * @param id The user object ID
   * @returns The user object
   */
  async findOne(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id, isDeleted: false },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   *  Find a user by their email address
   * @param email The user email address
   * @returns The user object
   */
  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Update a user by their ID
   * @param id The user object ID
   * @param updateAccountDto The user account details to be updated
   * @returns The updated user object
   */
  async update(id: string, updateAccountDto: UpdateAccountDto) {
    try {
      return await this.prisma.user.update({
        where: { id, isDeleted: false },
        data: updateAccountDto,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   *  Soft delete a user by their ID
   * @param id The user object ID
   * @returns  The deleted user object ID
   */
  async delete(id: string) {
    try {
      return this.prisma.user.update({
        where: { id, isDeleted: false },
        data: { isDeleted: true },
        select: { id: true },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }

  /**
   * Close a user account by their ID
   * @param id The user object ID
   * @returns The updated user object with accountStatus set to deleted and isDeleted set to true
   */
  async closeAccount(id: string) {
    try {
      return this.prisma.user.update({
        where: { id, isDeleted: false },
        data: { accountStatus: AccountStatus.deleted, isDeleted: true },
        select: { id: true, accountStatus: true },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw new BadRequestException(error.message, { cause: error });
      }

      throw new InternalServerErrorException(
        "We couldn't process your request at the moment. Please try again later.",
        { cause: error },
      );
    }
  }
}
