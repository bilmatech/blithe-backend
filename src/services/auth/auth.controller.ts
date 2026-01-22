import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '@sabiflow/common/decorators/response-message.decorator';
import { AccountResponse } from '@sabiflow/account/entities/account.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenResponse } from './entities/auth.entity';
import { PinChallengeResponse } from './entities/pin-challenge.entity';
import { CreateApppinDto } from '@sabiflow/account/dto/create-apppin.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { AuthorizedUser } from './decorators/authorized-user.decorator';
import { AuthUser } from './auth.type';
import { Request as ExpressRequest } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------------------------------------------------
  @ApiOperation({ summary: 'Authorize user using Firebase token' })
  @ApiBody({ type: CreateAuthDto })
  @ApiOkResponse({
    type: AccountResponse,
    description: 'User authorized successfully',
  })
  // ---------------------------------------------------------
  @ResponseMessage('User authorized successfully.')
  // ---------------------------------------------------------
  @Post()
  authorize(
    @Body() createAuthDto: CreateAuthDto,
    @Request() req: ExpressRequest,
  ) {
    return this.authService.authorize(createAuthDto, req);
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
