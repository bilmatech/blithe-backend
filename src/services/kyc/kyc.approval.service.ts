import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@Blithe/services/database/prisma.service';
import { KYCVerificationStatus } from '@DB/Client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationArgs,
  getPaginationMetadata,
} from '../../common/utils/paginator.util';

@Injectable()
export class KycApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------
  // LIST PENDING KYCs (PAGINATED)
  // --------------------------------------
  async listPendingKycs(pagination: PaginationQueryDto) {
    const where = {
      isDeleted: false,
      kycverification: {
        status: KYCVerificationStatus.pending,
      },
    };

    const [schools, total] = await this.prisma.$transaction([
      this.prisma.school.findMany({
        where,
        ...buildPaginationArgs(pagination),
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
          kycverification: {
            select: {
              status: true,
            },
          },
        },
      }),
      this.prisma.school.count({ where }),
    ]);

    return getPaginationMetadata(
      schools,
      pagination.page,
      pagination.limit,
      total,
    );
  }

  // --------------------------------------
  // GET FULL KYC FOR ADMIN REVIEW
  // --------------------------------------
  async getKycForReview(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        kycverification: true,
        schoolDirectorVerification: true,
        schoolOwnershipVerification: true,
        schoolVerification: true,
        schoolPayoutDetail: true,
        schoolAndPlatformLegalAgreement: true,
        SchoolContactPerson: true,
      },
    });

    if (!school) {
      throw new BadRequestException('School not found');
    }

    if (!school.kycverification) {
      throw new BadRequestException('KYC not started');
    }

    return school;
  }

  // --------------------------------------
  // APPROVE KYC
  // --------------------------------------
  async approveKyc(schoolId: string, adminId: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { schoolId },
    });

    if (!kyc) {
      throw new BadRequestException('KYC record not found');
    }

    if (kyc.status !== KYCVerificationStatus.pending) {
      throw new BadRequestException('KYC is not pending');
    }

      await this.prisma.kYCVerification.update({
    where: { schoolId },
    data: {
      status: KYCVerificationStatus.verified,
    },
  });

    return { success: true };
  }

  // --------------------------------------
  // REJECT KYC (NO REASON)
  // --------------------------------------
  async rejectKyc(schoolId: string, adminId: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { schoolId },
    });

    if (!kyc) {
      throw new BadRequestException('KYC record not found');
    }

    if (kyc.status !== KYCVerificationStatus.pending) {
      throw new BadRequestException('KYC is not pending');
    }
  await this.prisma.kYCVerification.update({
    where: { schoolId },
    data: {
      status: KYCVerificationStatus.rejected,
    },
  });
    return { success: true };
  }
}