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
}
