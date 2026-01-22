import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
import {
  Account,
  AuthCredentialsResponse,
} from '@Blithe/services/account/entities/account.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenResponse } from './entities/auth.entity';
import { PinChallengeResponse } from './entities/pin-challenge.entity';
import { CreateApppinDto } from '@Blithe/services/account/dto/create-apppin.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { AuthorizedUser } from './decorators/authorized-user.decorator';
import { AuthUser } from './auth.type';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { UserType } from '@DB/Client';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerificationCodeDto } from '../account/dto/verificaiton-code.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Create new guardian account' })
  @ApiBody({ type: CreateAuthUserDto })
  @ApiOkResponse({
    type: Account,
    description: 'User account object. ',
  })
  // ---------------------------------------------------------
  @ResponseMessage(
    'User account created successfully, please verify your email.',
  )
  // ---------------------------------------------------------
  @Post('create_guardian_account')
  createGuardianAccount(@Body() createAuthDto: CreateAuthUserDto) {
    return this.authService.createAccount(createAuthDto, UserType.guardian);
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Create new school account' })
  @ApiBody({ type: CreateAuthUserDto })
  @ApiOkResponse({
    type: Account,
    description: 'User account object. ',
  })
  // ---------------------------------------------------------
  @ResponseMessage(
    'User account created successfully, please verify your email.',
  )
  // ---------------------------------------------------------
  @Post('create_school_account')
  createSchoolAccount(@Body() createAuthDto: CreateAuthUserDto) {
    return this.authService.createAccount(createAuthDto, UserType.school);
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Create new admin account' })
  @ApiBody({ type: CreateAuthUserDto })
  @ApiOkResponse({
    type: Account,
    description: 'User account object. ',
  })
  // ---------------------------------------------------------
  @ResponseMessage(
    'User account created successfully, please verify your email.',
  )
  // ---------------------------------------------------------
  @Post('create_admin_account')
  createAdminAccount(@Body() createAuthDto: CreateAuthUserDto) {
    return this.authService.createAccount(
      createAuthDto,
      UserType.administrator,
    );
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Resend account verification code' })
  @ApiBody({ type: ResendCodeDto })
  @ApiOkResponse({
    type: String,
    description: 'Verification code resent successfully',
  })
  // ---------------------------------------------------------
  @ResponseMessage('Verification code resent successfully.')
  // ---------------------------------------------------------
  @Post('resend_verification_code')
  resendVerificationCode(@Body() body: ResendCodeDto) {
    return this.authService.resendAccountVerificationCode(body);
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Verify account using verification code' })
  @ApiBody({ type: VerificationCodeDto })
  @ApiOkResponse({
    type: AuthCredentialsResponse,
    description: 'Account verified successfully',
  })
  // ---------------------------------------------------------
  @ResponseMessage('Account verified successfully.')
  // ---------------------------------------------------------
  @Post('verify_account')
  verifyAccount(@Body() body: VerificationCodeDto) {
    return this.authService.verifyAccount(body);
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    type: RefreshTokenResponse,
    description: 'Tokens refreshed successfully',
  })
  // ---------------------------------------------------------
  @ResponseMessage('Tokens refreshed successfully.')
  // ---------------------------------------------------------
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.token);
  }

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Revoke all refresh tokens for a user' })
  @ApiOkResponse({
    type: String,
    description: 'All refresh tokens revoked successfully',
  })
  // ---------------------------------------------------------
  @ResponseMessage('Logged out successfully.')
  // ---------------------------------------------------------
  @Post('logout')
  logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body.token);
  }

  // ---------------------------------------------------------
  @ApiOperation({
    summary: 'Verify user app PIN and issue a PIN challenge token',
  })
  @ApiBody({ type: CreateApppinDto })
  @ApiOkResponse({
    type: PinChallengeResponse,
    description: 'App PIN verified successfully',
  })
  // ---------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // ---------------------------------------------------------
  @ResponseMessage('App PIN verified successfully.')
  // ---------------------------------------------------------
  @Post('verify_app_pin')
  verifyAppPin(
    @Body() body: CreateApppinDto,
    @AuthorizedUser() authUser: AuthUser,
  ) {
    return this.authService.verifyAppPin(authUser.id, body.pin.toString());
  }
}
