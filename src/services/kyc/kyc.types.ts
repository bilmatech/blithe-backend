/**
 * Shared Enums for School Identity and KYC.
 */

export enum UserType {
  ADMINISTRATOR = 'administrator',
  GUARDIAN = 'guardian',
  SCHOOL = 'school',
}

export enum SchoolType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

export enum SchoolOwnership {
  PRIVATE = 'private',
  PUBLIC = 'public',
  MISSIONARY = 'missionary',
}

export enum SchoolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum DirectorIDType {
  DRIVERS_LICENSE = 'drivers_license',
  INTERNATIONAL_PASSPORT = 'international_passport',
  NIN = 'nin',
  VOTERS_ID = 'voters_id',
}

export enum KYCVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

export enum ContactRole {
  BURSAR = 'bursar',
  ICT_OFFICER = 'ict_officer',
  OTHER = 'other'
}
