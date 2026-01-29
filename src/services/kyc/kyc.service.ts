import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DirectorVerificationDto, SchoolAgreementDto, SchoolContactsDto, SchoolInfoDto } from './dto/create-kyc.dto';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '@Blithe/common/utils/error-handler.util';
import { ContactRole, KYCVerificationStatus } from './kyc.types';
import { MediaUploadService } from '../media/media-upload.service';
import { Prisma } from '@DB/Client';

@Injectable()
export class KycService {
  submitLegalAgreement(id: string, dto: SchoolAgreementDto) {
    throw new Error('Method not implemented.');
  }
  submitSchoolAgreement(id: string, dto: SchoolAgreementDto) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaUploadService: MediaUploadService,
  ) { }

  /**
   * STEP 1 — School Information
   */
  async submitSchoolInfo(userId: string, dto: SchoolInfoDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let school = await tx.school.findUnique({
          where: { ownerId: userId },
        });

        if (!school) {
          school = await tx.school.create({
            data: {
              ownerId: userId,
              name: dto.name,
              schoolType: dto.schoolType,
              ownership: dto.ownership,
              address: dto.address,
              state: dto.state,
              lga: dto.lga,
              email: dto.email,
              phoneNumber: dto.phoneNumber,
              establishedYear: dto.establishedYear,
              website: dto.website ?? null,
            },
          });
        } else {
          school = await tx.school.update({
            where: { id: school.id },
            data: {
              name: dto.name,
              schoolType: dto.schoolType,
              ownership: dto.ownership,
              address: dto.address,
              state: dto.state,
              lga: dto.lga,
              email: dto.email,
              phoneNumber: dto.phoneNumber,
              establishedYear: dto.establishedYear,
              website: dto.website ?? null,
            },
          });
        }

        await tx.kYCVerification.upsert({
          where: { schoolId: school.id },
          update: { updatedAt: new Date() },
          create: {
            schoolId: school.id,
            userId,
            status: KYCVerificationStatus.PENDING,
          },
        });

        return {
          step: 1,
          stepName: 'SCHOOL_INFORMATION',
          completed: true,
          schoolId: school.id,
        };
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to submit school information',
        { cause: error },
      );
    }
  }

  /**
   * STEP 2 — Director Verification
   */
  async submitDirectorVerification(
    userId: string,
    dto: DirectorVerificationDto,
    document: Express.Multer.File,
  ) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { ownerId: userId },
      });

      if (!school) {
        throw new BadRequestException('Unauthorized school access');
      }

      if (!document) {
        throw new BadRequestException('Director ID document is required');
      }

      const documentUrl =
        await this.mediaUploadService.uploadDocumentMedia(document);

      if (!documentUrl) {
        throw new InternalServerErrorException('Document upload failed');
      }

      await this.prisma.schoolDirectorVerification.upsert({
        where: { schoolId: school.id },
        update: {
          directorFullName: dto.directorFullName,
          directorIDType: dto.directorIDType,
          directorIDNumber: dto.directorIDNumber,
          document: documentUrl,
        },
        create: {
          schoolId: school.id,
          directorFullName: dto.directorFullName,
          directorIDType: dto.directorIDType,
          directorIDNumber: dto.directorIDNumber,
          document: documentUrl,
        },
      });

      return {
        step: 2,
        stepName: 'DIRECTOR_VERIFICATION',
        completed: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to submit director verification',
        { cause: error },
      );
    }
  }

  /**
   * STEP 3 & 4 — School Legal & Ownership Documents
   * ONE endpoint → TWO tables
   */
  async submitSchoolVerificationDocuments(
    userId: string,
    files: {
      cacCertificate?: Express.Multer.File[];
      accreditationDocument?: Express.Multer.File[];
      taxIdentificationNumberCertificate?: Express.Multer.File[];
      licenseDocument?: Express.Multer.File[];
      cacForm7?: Express.Multer.File[];
      cacShareAllotmentForm?: Express.Multer.File[];
    },
  ) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { ownerId: userId },
      });

      if (!school) {
        throw new BadRequestException('Unauthorized school access');
      }

      const upload = async (file?: Express.Multer.File[]) => {
        if (!file?.[0]) return null;
        const url =
          await this.mediaUploadService.uploadDocumentMedia(file[0]);
        if (!url) {
          throw new InternalServerErrorException(
            'Document upload failed',
          );
        }
        return url;
      };

      const [
        cacCertificate,
        accreditationDocument,
        taxIdentificationNumberCertificate,
        licenseDocument,
        cacForm7,
        cacShareAllotmentForm,
      ] = await Promise.all([
        upload(files.cacCertificate),
        upload(files.accreditationDocument),
        upload(files.taxIdentificationNumberCertificate),
        upload(files.licenseDocument),
        upload(files.cacForm7),
        upload(files.cacShareAllotmentForm),
      ]);

      if (
        !cacCertificate &&
        !accreditationDocument &&
        !taxIdentificationNumberCertificate &&
        !licenseDocument &&
        !cacForm7 &&
        !cacShareAllotmentForm
      ) {
        throw new BadRequestException(
          'At least one verification document is required',
        );
      }

      // Legal verification
      if (
        cacCertificate ||
        accreditationDocument ||
        taxIdentificationNumberCertificate ||
        licenseDocument
      ) {
        await this.prisma.schoolVerification.upsert({
          where: { schoolId: school.id },
          update: {
            ...(cacCertificate && { cacCertificate }),
            ...(accreditationDocument && {
              accreditationDocument,
            }),
            ...(taxIdentificationNumberCertificate && {
              taxIdentificationNumberCertificate,
            }),
            ...(licenseDocument && { licenseDocument }),
            updatedAt: new Date(),
          },
          create: {
            schoolId: school.id,
            cacCertificate: cacCertificate ?? '',
            accreditationDocument:
              accreditationDocument ?? '',
            taxIdentificationNumberCertificate: taxIdentificationNumberCertificate ?? '',
            licenseDocument: licenseDocument ?? '',
          },
        });
      }

      // Ownership verification
      if (cacForm7 || cacShareAllotmentForm) {
        await this.prisma.schoolOwnershipVerification.upsert({
          where: { schoolId: school.id },
          update: {
            ...(cacForm7 && { cacform7: cacForm7 }),
            ...(cacShareAllotmentForm && {
              cacShareAllotmentForm,
            }),
            updatedAt: new Date(),
          },
          create: {
            schoolId: school.id,
            cacform7: cacForm7 ?? '',
            cacShareAllotmentForm:
              cacShareAllotmentForm ?? '',
          },
        });
      }

      return {
        step: 4,
        stepName: 'SCHOOL_VERIFICATION_DOCUMENTS',
        completed: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to submit school verification documents',
        { cause: error },
      );
    }
  }

  /**
   * STEP 5 — Bank Payout Reference Letter
   */
  async submitBankPayoutDetails(
    userId: string,
    document: Express.Multer.File,
  ) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { ownerId: userId },
      });

      if (!school) {
        throw new BadRequestException('Unauthorized school access');
      }

      if (!document) {
        throw new BadRequestException(
          'Bank reference letter document is required',
        );
      }

      const documentUrl =
        await this.mediaUploadService.uploadDocumentMedia(document);

      if (!documentUrl) {
        throw new InternalServerErrorException('Document upload failed');
      }

      await this.prisma.schoolPayoutDetail.update({
        where: { schoolId: school.id },
        data: { bankReferenceLetter: documentUrl },
      });

      return {
        step: 5,
        stepName: 'BANK_PAYOUT_DETAILS',
        completed: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to submit bank payout details',
        { cause: error },
      );
    }
  }



  /**
   * STEP 6 — School Contact Persons
   */
  async submitSchoolContacts(userId: string, dto: SchoolContactsDto) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { ownerId: userId },
      });

      if (!school) {
        throw new BadRequestException('Unauthorized school access');
      }

      const operations: Prisma.PrismaPromise<unknown>[] = [];

      // =========================
      // BURSAR
      // =========================
      operations.push(
        this.prisma.schoolContactPerson.upsert({
          where: {
            schoolId_role: {
              schoolId: school.id,
              role: ContactRole.BURSAR,
            },
          },
          update: {
            name: dto.bursarName,
            phone: dto.bursarPhone,
            email: dto.bursarEmail,
          },
          create: {
            schoolId: school.id,
            role: ContactRole.BURSAR,
            name: dto.bursarName,
            phone: dto.bursarPhone,
            email: dto.bursarEmail,
          },
        }),
      );

      // =========================
      // ICT OFFICER
      // =========================
      operations.push(
        this.prisma.schoolContactPerson.upsert({
          where: {
            schoolId_role: {
              schoolId: school.id,
              role: ContactRole.ICT_OFFICER,
            },
          },
          update: {
            name: dto.ictName,
            phone: dto.ictPhone,
            email: dto.ictEmail,
          },
          create: {
            schoolId: school.id,
            role: ContactRole.ICT_OFFICER,
            name: dto.ictName,
            phone: dto.ictPhone,
            email: dto.ictEmail,
          },
        }),
      );

      // =========================
      // OTHER (optional)
      // =========================
      if (dto.otherName && dto.otherPhone && dto.otherEmail) {
        operations.push(
          this.prisma.schoolContactPerson.upsert({
            where: {
              schoolId_role: {
                schoolId: school.id,
                role: ContactRole.OTHER,
              },
            },
            update: {
              name: dto.otherName,
              phone: dto.otherPhone,
              email: dto.otherEmail,
            },
            create: {
              schoolId: school.id,
              role: ContactRole.OTHER,
              name: dto.otherName,
              phone: dto.otherPhone,
              email: dto.otherEmail,
            },
          }),
        );
      }

      await this.prisma.$transaction(operations);

      return {
        step: 6,
        stepName: 'SCHOOL_CONTACTS',
        completed: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to submit school contact details',
        { cause: error },
      );
    }
  }
}

  export async function submitSchoolAgreement(
  userId: string,
  dto: SchoolAgreementDto,
) {
  try {
    if (!dto.agreed) {
      throw new BadRequestException('You must agree to the terms');
    }

    const school = await this.prisma.school.findUnique({
      where: { ownerId: userId },
    });

    if (!school) {
      throw new BadRequestException('Unauthorized school access');
    }

    // Prevent re-signing
    const existingAgreement =
      await this.prisma.schoolAndPlatformLegalAgreement.findUnique({
        where: { schoolId: school.id },
      });

    if (existingAgreement) {
      throw new BadRequestException(
        'Agreement has already been signed',
      );
    }

    await this.prisma.schoolAndPlatformLegalAgreement.create({
      data: {
        schoolId: school.id,
        signedById: userId,
        agreedByName: dto.agreedByName,
        signedAt: new Date(),
        legalDocumentRef:
          dto.legalDocumentRef ?? 'PLATFORM_TERMS_v1.0',
      },
    });

    // OPTIONAL: mark KYC as ready for review
    await this.prisma.kYCVerification.update({
      where: { schoolId: school.id },
      data: { status: 'pending' },
    });

    return {
      step: 7,
      stepName: 'COMPLIANCE_AND_AGREEMENT',
      completed: true,
    };
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to submit agreement',
      { cause: error },
    );
  }
}