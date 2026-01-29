import {Controller,Post,Body,UseGuards,UseInterceptors,UploadedFile,UploadedFiles,Req,Query,Get,Param,Patch } from '@nestjs/common';
import {ApiBody,ApiConsumes, ApiOkResponse,ApiOperation,ApiTags,} from '@nestjs/swagger';
import {FileFieldsInterceptor,FileInterceptor,} from '@nestjs/platform-express';

import { KycService } from './kyc.service';
import { DirectorVerificationDto,SchoolAgreementDto,SchoolContactsDto,SchoolInfoDto,} from './dto/create-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { AuthorizedUser } from '../auth/decorators/authorized-user.decorator';
import { AuthUser } from '../auth/auth.type';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
import { AuthGuard } from '@nestjs/passport';
import { KycApprovalService } from './kyc.approval.service';
import { PaginationQueryDto } from '@Blithe/common/dto/pagination-query.dto';
import { RoleGuard } from '../auth/guards/account.guard';
import { UserType } from '@DB/Client';
import { UseRolesGuard } from '../auth/decorators/roles.decorator';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) { }

  /**
   * STEP 1 — School Information
   */
  @ApiOperation({ summary: 'Step 1: Submit school basic information' })
  @ApiBody({ type: SchoolInfoDto })
  @ApiOkResponse({ description: 'School information saved successfully' })
  @ResponseMessage('School information saved successfully')
  @Post('step-1/school-info')
  async submitSchoolInfo(
    @AuthorizedUser() authUser: AuthUser,
    @Body() dto: SchoolInfoDto,
  ) {
    return this.kycService.submitSchoolInfo(authUser.id, dto);
  }

  /**
   * STEP 2 — Director Verification
   */
  @ApiOperation({ summary: 'Step 2: Director verification' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: DirectorVerificationDto })
  @ApiOkResponse({
    description: 'Director verification submitted successfully',
  })
  @UseInterceptors(FileInterceptor('document'))
  @ResponseMessage('Director verification submitted successfully')
  @Post('step-2/director-verification')
  async submitDirectorVerification(
    @AuthorizedUser() authUser: AuthUser,
    @Body() dto: DirectorVerificationDto,
    @UploadedFile() document: Express.Multer.File,
  ) {
    return this.kycService.submitDirectorVerification(
      authUser.id,
      dto,
      document,
    );
  }

  /**
   * STEP 4 — School Legal & Ownership Documents
   * ONE endpoint → TWO tables
   */
  @ApiOperation({
    summary: 'Step 4: Upload school legal & ownership documents',
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'School verification documents submitted successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cacCertificate', maxCount: 1 },
      { name: 'accreditationDocument', maxCount: 1 },
      { name: 'taxIdentificationNumberCertificate', maxCount: 1 },
      { name: 'licenseDocument', maxCount: 1 },
      { name: 'cacForm7', maxCount: 1 },
      { name: 'cacShareAllotmentForm', maxCount: 1 },
    ]),
  )
  @ResponseMessage('School verification documents submitted successfully')
  @Post('step-4/school-verification-documents')
  async submitSchoolVerificationDocuments(
    @AuthorizedUser() authUser: AuthUser,
    @UploadedFiles()
    files: {
      cacCertificate?: Express.Multer.File[];
      accreditationDocument?: Express.Multer.File[];
      taxIdentificationNumberCertificate?: Express.Multer.File[];
      licenseDocument?: Express.Multer.File[];
      cacForm7?: Express.Multer.File[];
      cacShareAllotmentForm?: Express.Multer.File[];
    },
  ) {
    return this.kycService.submitSchoolVerificationDocuments(
      authUser.id,
      files,
    );
  }

  /**
   * STEP 5 — Bank Payout Reference Letter
   */
  @ApiOperation({
    summary: 'Step 5: Upload bank payout reference letter',
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'Bank payout details submitted successfully',
  })
  @UseInterceptors(FileInterceptor('bankReferenceLetter'))
  @ResponseMessage('Bank payout details submitted successfully')
  @Post('step-5/bank-payout-details')
  async submitBankPayoutDetails(
    @AuthorizedUser() authUser: AuthUser,
    @UploadedFile() document: Express.Multer.File,
  ) {
    return this.kycService.submitBankPayoutDetails(
      authUser.id,
      document,
    );
  }

 
  /**
  * STEP 6 — School Contact Persons
  */
  @ApiOperation({
    summary: 'Step 6: Submit school contact persons',
  })
  @ApiOkResponse({
    description: 'School contact persons submitted successfully',
  })
  @ResponseMessage('School contact persons submitted successfully')
  @Post('step-6/school-contacts')
  async submitSchoolContacts(
    @AuthorizedUser() authUser: AuthUser,
    @Body() dto: SchoolContactsDto,
  ) {
    return this.kycService.submitSchoolContacts(
      authUser.id,
      dto,
    );
  }


  /**
 * STEP 7 — Compliance & Agreement
 */

@ApiOperation({
  summary: 'Step 7: Accept platform terms and submit KYC',
})
@ApiOkResponse({
  description: 'KYC submitted successfully',
})
@ResponseMessage('KYC submitted successfully and pending review')
@Post('step-7/legal-agreement')
async submitLegalAgreement(
  @AuthorizedUser() authUser: AuthUser,
  @Body() dto: SchoolAgreementDto,
) {
  return this.kycService.submitLegalAgreement(
    authUser.id,
    dto,
  );
  }
}


@ApiTags('KYC Admin')
@Controller()
export class KycApprovalController {
  constructor(
    private readonly kycApprovalService: KycApprovalService,
  ) {}

  // ===================================================
  // ||              ADMIN KYC ROUTES                 ||
  // ===================================================

  // --------------------------------------------------
  @ApiOperation({ summary: 'Admin: List pending KYCs' })
  @ApiOkResponse({
    description: 'Paginated list of pending KYCs retrieved successfully',
  })
  // --------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // --------------------------------------------------
  @ResponseMessage('Pending KYCs retrieved successfully')
  // --------------------------------------------------
  @Get('admin/kyc/pending')
  listPendingKycs(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.kycApprovalService.listPendingKycs(
      paginationQueryDto,
    );
  }

  // --------------------------------------------------
  @ApiOperation({ summary: 'Admin: View full KYC for review' })
  @ApiOkResponse({
    description: 'Full KYC retrieved successfully',
  })
  // --------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // --------------------------------------------------
  @ResponseMessage('KYC retrieved successfully')
  // --------------------------------------------------
  @Get('admin/kyc/:schoolId')
  getKycForReview(
    @Param('schoolId') schoolId: string,
  ) {
    return this.kycApprovalService.getKycForReview(
      schoolId,
    );
  }

  // --------------------------------------------------
  @ApiOperation({ summary: 'Admin: Approve KYC' })
  @ApiOkResponse({
    description: 'KYC approved successfully',
  })
  // --------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // --------------------------------------------------
  @ResponseMessage('KYC approved successfully')
  // --------------------------------------------------
  @Patch('admin/kyc/:schoolId/approve')
  approveKyc(
    @Param('schoolId') schoolId: string,
    @Req() req: { user: AuthUser },
  ) {
    return this.kycApprovalService.approveKyc(
      schoolId,
      req.user.id,
    );
  }

  // --------------------------------------------------
  @ApiOperation({ summary: 'Admin: Reject KYC' })
  @ApiOkResponse({
    description: 'KYC rejected successfully',
  })
  // --------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // --------------------------------------------------
  @ResponseMessage('KYC rejected successfully')
  // --------------------------------------------------
  @Patch('admin/kyc/:schoolId/reject')
  rejectKyc(
    @Param('schoolId') schoolId: string,
    @Req() req: { user: AuthUser },
  ) {
    return this.kycApprovalService.rejectKyc(
      schoolId,
      req.user.id,
    );
  }
}