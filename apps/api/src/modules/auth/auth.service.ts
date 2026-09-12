import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { generateSecret, generateURI, verify } from 'otplib';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { User } from '../../database/generated/prisma/client.js';
import {
  CHALLENGE_STORE,
  type ChallengeStore,
} from './challenge-store.service.js';
import { DisableMfaDto } from './dto/disable-mfa.dto.js';
import { EnableMfaDto } from './dto/enable-mfa.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponseEntity } from './entities/auth-response.entity.js';
import { BackupCodesEntity, MfaSetupEntity } from './entities/mfa.entity.js';
import { UserProfileEntity } from './entities/user-profile.entity.js';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_BYTES = 48;
const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_BYTES = 8;
/** TOTP window matching Sure's ROTP verify(code, drift_behind: 15) → 15 × 30s intervals behind. */
const TOTP_EPOCH_TOLERANCE: [number, number] = [450, 0];
const MFA_SETUP_TTL_SECONDS = 600;
const MFA_SETUP_KEY_PREFIX = 'auth:mfa-setup:';
/** Advisory lock serializing first-user (super_admin) creation. */
const FIRST_USER_ADVISORY_LOCK = 740_385_950;

const mfaSetupKey = (userId: string): string =>
  `${MFA_SETUP_KEY_PREFIX}${userId}`;

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(CHALLENGE_STORE) private readonly challenges: ChallengeStore,
  ) {}

  private get accessTokenTtlSeconds(): number {
    return this.config.get<number>('auth.jwt.accessTokenTtlSeconds') ?? 900;
  }

  private get refreshTokenTtlSeconds(): number {
    return (
      this.config.get<number>('auth.jwt.refreshTokenTtlSeconds') ?? 2_592_000
    );
  }

  private get productName(): string {
    return this.config.get<string>('app.productName') ?? 'Spend Book';
  }

  async register(
    dto: RegisterDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponseEntity> {
    const onboardingState =
      this.config.get<string>('auth.onboardingState') ?? 'open';
    if (onboardingState === 'closed') {
      throw new ForbiddenException('Registration is currently closed');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordDigest = await hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${FIRST_USER_ADVISORY_LOCK})`;
      const userCount = await tx.user.count();
      const role = userCount === 0 ? 'super_admin' : 'member';
      const family = await tx.family.create({
        data: {
          name: this.familyNameFor(dto, email),
          timezone: dto.timezone ?? null,
        },
      });
      return tx.user.create({
        data: {
          email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          locale: dto.locale ?? null,
          role,
          passwordDigest,
          familyId: family.id,
          webauthnId: randomBytes(16).toString('base64url'),
        },
      });
    });

    return this.createAuthResponse(user, metadata);
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponseEntity> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordDigest || !user.active) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await compare(dto.password, user.passwordDigest);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.otpRequired) {
      if (!dto.otpCode) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'MFA_REQUIRED',
          message: 'Two-factor authentication code required',
        });
      }
      const valid = await this.verifyMfaCode(
        user,
        dto.otpCode,
        dto.usage ?? 'totp',
      );
      if (!valid) {
        throw new UnauthorizedException('Invalid or expired code');
      }
    }

    return this.createAuthResponse(user, metadata);
  }

  async refresh(
    dto: RefreshTokenDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponseEntity> {
    const digest = this.refreshTokenDigest(dto.refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenDigest: digest },
    });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.createAuthResponse(user, metadata);
  }

  async logout(dto: LogoutDto): Promise<void> {
    const digest = this.refreshTokenDigest(dto.refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenDigest: digest },
    });
    if (session && !session.revokedAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getProfile(userId: string): Promise<UserProfileEntity> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toProfile(user);
  }

  async setupMfa(principal: AuthenticatedUser): Promise<MfaSetupEntity> {
    const user = await this.requireUser(principal.id);
    const secret = generateSecret();
    const uri = generateURI({
      secret,
      issuer: this.productName,
      label: user.email ?? user.id,
    });
    await this.challenges.set(
      mfaSetupKey(user.id),
      secret,
      MFA_SETUP_TTL_SECONDS,
    );
    return { secret, uri };
  }

  async enableMfa(
    principal: AuthenticatedUser,
    dto: EnableMfaDto,
  ): Promise<BackupCodesEntity> {
    const user = await this.requireUser(principal.id);
    const pendingSecret = await this.challenges.get<string>(
      mfaSetupKey(user.id),
    );
    if (!pendingSecret) {
      throw new BadRequestException(
        'No pending MFA setup; call /auth/mfa/setup first',
      );
    }
    const valid = await this.verifyTotp(pendingSecret, dto.code);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    const backupCodes = Array.from({ length: BACKUP_CODES_COUNT }, () =>
      randomBytes(BACKUP_CODE_BYTES).toString('hex').toUpperCase(),
    );
    const backupDigests = await Promise.all(
      backupCodes.map((code) => hash(code, BCRYPT_ROUNDS)),
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpSecret: pendingSecret,
        otpRequired: true,
        otpBackupCodes: backupDigests,
      },
    });
    await this.challenges.delete(mfaSetupKey(user.id));
    return { backupCodes };
  }

  async disableMfa(
    principal: AuthenticatedUser,
    dto: DisableMfaDto,
  ): Promise<void> {
    const user = await this.requireUser(principal.id);
    if (!user.otpRequired || !user.otpSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }
    const valid = await this.verifyMfaCode(user, dto.code, dto.usage ?? 'totp');
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpSecret: null, otpRequired: false, otpBackupCodes: [] },
    });
  }

  /** Builds an auth response (creates a fresh session row) for a verified user. */
  async createAuthResponse(
    user: User,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponseEntity> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        type: 'access',
      },
      { expiresIn: this.accessTokenTtlSeconds },
    );
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenDigest: this.refreshTokenDigest(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.toProfile(user),
      accessToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.accessTokenTtlSeconds,
      refreshToken,
    };
  }

  private toProfile(user: User): UserProfileEntity {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      familyId: user.familyId,
      active: user.active,
      otpRequired: user.otpRequired,
      onboardedAt: user.onboardedAt,
    };
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private verifyTotp(secret: string, code?: string): Promise<boolean> {
    if (!code) {
      return Promise.resolve(false);
    }
    return verify({ secret, token: code, epochTolerance: TOTP_EPOCH_TOLERANCE })
      .then((result) => result.valid)
      .catch(() => false);
  }

  private async verifyBackupCode(user: User, code?: string): Promise<boolean> {
    if (!code || user.otpBackupCodes.length === 0) {
      return false;
    }
    const normalized = code.trim().toUpperCase();
    for (const digest of user.otpBackupCodes) {
      if (await compare(normalized, digest)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            otpBackupCodes: user.otpBackupCodes.filter(
              (entry) => entry !== digest,
            ),
          },
        });
        return true;
      }
    }
    return false;
  }

  private async verifyMfaCode(
    user: User,
    code: string,
    usage: 'totp' | 'recovery_code',
  ): Promise<boolean> {
    return usage === 'recovery_code'
      ? this.verifyBackupCode(user, code)
      : this.verifyTotp(user.otpSecret ?? '', code);
  }

  private familyNameFor(dto: RegisterDto, email: string): string {
    const name = [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim();
    const owner = name || email.split('@')[0] || 'New';
    return `${owner}'s Family`;
  }

  private refreshTokenDigest(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
