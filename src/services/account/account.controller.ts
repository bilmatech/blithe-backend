import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserProfileResponse } from './entities/user-profile.entity';
import { CredentialsService } from './credentials.service';
import { CreateApppinDto } from './dto/create-apppin.dto';
import { AppPinResponse } from './entities/app-pin.entity';
import { ResponseMessage } from '@Blithe/common/decorators/response-message.decorator';
import { PaginationQueryDto } from '@Blithe/common/dto/pagination-query.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { AuthUser } from '../auth/auth.type';
import { AuthorizedUser } from '../auth/decorators/authorized-user.decorator';
import { RoleGuard } from '../auth/guards/account.guard';
import { UserType } from '@DB/Client';
import { UseRolesGuard } from '../auth/decorators/roles.decorator';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly credentialsService: CredentialsService,
  ) {}

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Set App Pin' })
  @ApiBody({ type: CreateApppinDto })
  @ApiOkResponse({
    type: AppPinResponse,
    description: 'App pin set successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // -----------------------------------------------------
  @ResponseMessage('PIN has been set successfully')
  // -----------------------------------------------------
  @Post('set_app_pin')
  setAppPin(
    @Body() createApppinDto: CreateApppinDto,
    @AuthorizedUser() authUser: AuthUser,
  ) {
    return this.credentialsService.setPin(authUser.id, createApppinDto);
  }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Get User Profile' })
  @ApiOkResponse({
    type: UserProfileResponse,
    description: 'User profile retrieved successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // -----------------------------------------------------
  @ResponseMessage('User profile retrieved successfully')
  // -----------------------------------------------------
  @Get('profile')
  getProfile(@AuthorizedUser() authUser: AuthUser) {
    return this.accountService.findOne(authUser.id);
  }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Update User Profile' })
  @ApiBody({ type: UpdateAccountDto })
  @ApiOkResponse({
    type: UserProfileResponse,
    description: 'User profile updated successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // -----------------------------------------------------
  @ResponseMessage('User profile updated successfully')
  // -----------------------------------------------------
  @Patch('profile')
  updateProfile(
    @AuthorizedUser() authUser: AuthUser,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(authUser.id, updateAccountDto);
  }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Close User Account' })
  @ApiOkResponse({
    type: UserProfileResponse,
    description: 'User account closed successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard)
  // -----------------------------------------------------
  @ResponseMessage('User account closed successfully')
  // -----------------------------------------------------
  @Delete('close')
  closeAccount(@AuthorizedUser() authUser: AuthUser) {
    return this.accountService.closeAccount(authUser.id);
  }

  // ===================================================
  // ||                  ADMIN ROUTES                 ||
  // ===================================================

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Admin: Fetch all users' })
  @ApiOkResponse({
    description: 'Paginated list of users retrieved successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // -----------------------------------------------------
  @ResponseMessage('User retrieved successfully')
  // -----------------------------------------------------
  @Get('admin/users')
  findAllUsers(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.accountService.findAll(paginationQueryDto);
  }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Admin: Fetch user account' })
  @ApiOkResponse({
    type: UserProfileResponse,
    description: 'User profile retrieved successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // -----------------------------------------------------
  @ResponseMessage('User profile retrieved successfully')
  // -----------------------------------------------------
  @Get('admin/user/:id')
  findUserById(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Admin: Delete user account' })
  @ApiOkResponse({
    type: UserProfileResponse,
    description: 'User account closed successfully',
  })
  // -----------------------------------------------------
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseRolesGuard(UserType.administrator)
  // -----------------------------------------------------
  @ResponseMessage('User account closed successfully')
  // -----------------------------------------------------
  @Delete('admin/users/:id')
  closeUserAccount(@Param('id') id: string) {
    return this.accountService.delete(id);
  }
}
