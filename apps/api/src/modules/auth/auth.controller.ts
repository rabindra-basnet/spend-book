import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { WebauthnService } from './webauthn.service.js';
import { DisableMfaDto } from './dto/disable-mfa.dto.js';
import { EnableMfaDto } from './dto/enable-mfa.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyWebauthnRegistrationDto } from './dto/verify-webauthn-registration.dto.js';
import {
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
} from './dto/webauthn.dto.js';
import { AuthResponseEntity } from './entities/auth-response.entity.js';
import {
  BackupCodesEntity,
  MfaSetupEntity,
  PasskeyRegistrationResultEntity,
} from './entities/mfa.entity.js';
import { UserProfileEntity } from './entities/user-profile.entity.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly webauthn: WebauthnService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user and family' })
  @ApiOkResponse({ type: AuthResponseEntity })
  @ApiUnauthorizedResponse({
    description: 'Validation error / closed registration / duplicate email',
  })
  register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseEntity> {
    return this.auth.register(dto, { ipAddress: ip, userAgent });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Authenticate with email + password (+ optional TOTP / recovery code)',
  })
  @ApiOkResponse({ type: AuthResponseEntity })
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseEntity> {
    return this.auth.login(dto, { ipAddress: ip, userAgent });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token' })
  @ApiOkResponse({ type: AuthResponseEntity })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseEntity> {
    return this.auth.refresh(dto, { ipAddress: ip, userAgent });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token (log out a session)' })
  logout(@Body() dto: LogoutDto): Promise<void> {
    return this.auth.logout(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user profile' })
  @ApiOkResponse({ type: UserProfileEntity })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileEntity> {
    return this.auth.getProfile(user.id);
  }

  // -----------------------------------------------------------------------
  //  MFA
  // -----------------------------------------------------------------------

  @ApiBearerAuth()
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a temporary TOTP secret and URI (enabled on verify)',
  })
  @ApiOkResponse({ type: MfaSetupEntity })
  setupMfa(@CurrentUser() user: AuthenticatedUser): Promise<MfaSetupEntity> {
    return this.auth.setupMfa(user);
  }

  @ApiBearerAuth()
  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a TOTP code to enable MFA and return backup codes',
  })
  @ApiOkResponse({ type: BackupCodesEntity })
  enableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EnableMfaDto,
  ): Promise<BackupCodesEntity> {
    return this.auth.enableMfa(user, dto);
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  disableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DisableMfaDto,
  ): Promise<void> {
    return this.auth.disableMfa(user, dto);
  }

  // -----------------------------------------------------------------------
  //  WebAuthn / Passkeys
  // -----------------------------------------------------------------------

  @ApiBearerAuth()
  @Post('webauthn/registration/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return PublicKeyCredentialCreationOptions to register a passkey',
  })
  webauthnRegistrationOptions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<unknown> {
    return this.webauthn.registrationOptions(user);
  }

  @ApiBearerAuth()
  @Post('webauthn/registration/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the browser passkey registration response' })
  @ApiOkResponse({ type: PasskeyRegistrationResultEntity })
  webauthnRegistrationVerify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyWebauthnRegistrationDto,
  ): Promise<PasskeyRegistrationResultEntity> {
    return this.webauthn.verifyRegistration(user, dto);
  }

  @Public()
  @Post('passkey/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return PublicKeyCredentialRequestOptions for passwordless login',
  })
  passkeyLoginOptions(@Body() dto: PasskeyLoginOptionsDto): Promise<unknown> {
    return this.webauthn.loginOptions(dto);
  }

  @Public()
  @Post('passkey/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a passkey assertion and complete login' })
  @ApiOkResponse({ type: AuthResponseEntity })
  passkeyLoginVerify(
    @Body() dto: PasskeyLoginVerifyDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseEntity> {
    return this.webauthn.loginVerify(dto, { ipAddress: ip, userAgent });
  }
}
