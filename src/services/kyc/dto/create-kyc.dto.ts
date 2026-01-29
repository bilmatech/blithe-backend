import { IsNotEmpty, IsString, IsEnum, IsOptional, IsInt, IsEmail, IsUrl, Length, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SchoolType, SchoolOwnership, DirectorIDType } from '../kyc.types';

/**
 * STEP 1: School Basic Information
 * Purpose: Identity attributes for the School record.
 */
export class SchoolInfoDto {
  @ApiProperty({ example: 'Greenwood Academy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: SchoolType })
  @IsEnum(SchoolType)
  schoolType: SchoolType;

  @ApiProperty({ enum: SchoolOwnership })
  @IsEnum(SchoolOwnership)
  ownership: SchoolOwnership;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  lga: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsInt()
  @IsOptional()
  establishedYear?: number;

  @ApiProperty({ example: 'https://school.edu.ng' })
  @IsUrl()
  @IsOptional()
  website?: string;
}

/**
 * STEP 2: Director Verification
 */
export class DirectorVerificationDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  directorFullName: string;

  @ApiProperty({ example: 'director@school.com' })
  @IsEmail()
  @IsNotEmpty()
  directorEmailAddress: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  directorPhoneNumber: string;

  @ApiProperty({ enum: DirectorIDType })
  @IsEnum(DirectorIDType)
  directorIDType: DirectorIDType;

  @ApiProperty({ example: 'NIN123456789' })
  @IsString()
  @IsNotEmpty()
  directorIDNumber: string;

  // File 'document' (ID), 'form7', and 'sharesAllotment' handled via interceptor
}

/**
 * STEP 3 & 4: School Ownership & Accreditation
 */

  // Files cacCertificate','accreditationDocument','taxIdentificationNumberCertificate','licenseDocument', 'cacForm7','cacShareAllotmentForm',  handled via interceptor

/**
 * STEP 5: Financial & Payout Information
 * Matches Screenshot 6 and maps to the 'SchoolPayoutDetail' model.
 */
export class SchoolPayoutDto {
  @ApiProperty({
    description: 'The official name of the bank',
    example: 'Zenith Bank',
  })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({
    description: 'The unique code for the bank (e.g., NIP code or Sort code)',
    example: '057',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 10) 
  bankCode: string;

  @ApiProperty({
    description: 'The 10-digit NUBAN account number',
    example: '1012345678',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'Account number must be exactly 10 digits' })
  accountNumber: string;

  @ApiProperty({
    description: 'The name registered on the bank account',
    example: 'Blithe Academy Ltd',
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  // File 'bankReferenceLetter' handled via interceptor
}

/**
 * STEP 6: School Contact Persons
 */

export class SchoolContactsDto {
  // =========================
  // BURSAR (required)
  // =========================
  @IsString()
  @IsNotEmpty()
  bursarName: string;

  @IsString()
  @IsNotEmpty()
  bursarPhone: string;

  @IsEmail()
  @IsNotEmpty()
  bursarEmail: string;

  // =========================
  // ICT OFFICER (required)
  // =========================
  @IsString()
  @IsNotEmpty()
  ictName: string;

  @IsString()
  @IsNotEmpty()
  ictPhone: string;

  @IsEmail()
  @IsNotEmpty()
  ictEmail: string;

  // =========================
  // OTHER CONTACT (optional)
  // =========================
  @IsOptional()
  @IsString()
  otherName?: string;

  @IsOptional()
  @IsString()
  otherPhone?: string;

  @IsOptional()
  @IsEmail()
  otherEmail?: string;
}


// STEP 7: School Agreement
export class SchoolAgreementDto {
  @IsString()
  @IsNotEmpty()
  agreedByName: string;

  @IsBoolean()
  agreed: true; // must be true, otherwise reject

  @IsOptional()
  @IsString()
  legalDocumentRef?: string; // default in service
}