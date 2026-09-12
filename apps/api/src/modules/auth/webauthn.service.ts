import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { PrismaService } from '../../database/prisma.service.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { AuthService, type SessionMetadata } from './auth.service.js';
import { TokenResponseEntity } from './entities/auth-response.entity.js';
import {
  CHALLENGE_STORE,
  type ChallengeStore,
} from './challenge-store.service.js';
import {
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
} from './dto/webauthn.dto.js';
import { VerifyWebauthnRegistrationDto } from './dto/verify-webauthn-registration.dto.js';
import { PasskeyRegistrationResultEntity } from './entities/mfa.entity.js';

const CHALLENGE_TTL_SECONDS = 300;
const REGISTRATION_KEY_PREFIX = 'auth:wa:reg:';
const AUTH_CHALLENGE_KEY_PREFIX = 'auth:wa:auth:';

const registrationKey = (userId: string): string =>
  `${REGISTRATION_KEY_PREFIX}${userId}`;
const authChallengeKey = (challenge: string): string =>
  `${AUTH_CHALLENGE_KEY_PREFIX}${challenge}`;

interface AuthChallengeEntry {
  /** User the challenge was scoped to (email login) or null for usernameless login. */
  userId: string | null;
}

@Injectable()
export class WebauthnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    @Inject(CHALLENGE_STORE) private readonly challenges: ChallengeStore,
  ) {}

  private get rpId(): string {
    return (
      this.config.get<string>('auth.webauthnRpId') ||
      this.config.get<string>('app.domain') ||
      'localhost'
    );
  }

  private get allowedOrigins(): string[] {
    const fromConfig = this.config.get<string[]>('auth.webauthnAllowedOrigins');
    if (fromConfig && fromConfig.length > 0) {
      return fromConfig;
    }
    return ['http://localhost:3000', 'http://localhost:5173'];
  }

  private get productName(): string {
    return this.config.get<string>('app.productName') ?? 'Spend Book';
  }

  private get passkeyLoginEnabled(): boolean {
    return this.config.get<boolean>('auth.passkeyLoginEnabled') ?? true;
  }

  async registrationOptions(principal: AuthenticatedUser): Promise<unknown> {
    const user = await this.requireUser(principal.id, true);
    const credentials = await this.prisma.webauthnCredential.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });
    const options = await generateRegistrationOptions({
      rpName: this.productName,
      rpID: this.rpId,
      userName: user.email ?? user.id,
      userID: isoBase64URL.toBuffer(user.webauthnId!),
      userDisplayName:
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        undefined,
      excludeCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports:
          credential.transports.length > 0
            ? credential.transports
            : (undefined as never),
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      attestationType: 'none',
    });
    await this.challenges.set(
      registrationKey(user.id),
      options.challenge,
      CHALLENGE_TTL_SECONDS,
    );
    return options;
  }

  async verifyRegistration(
    principal: AuthenticatedUser,
    dto: VerifyWebauthnRegistrationDto,
  ): Promise<PasskeyRegistrationResultEntity> {
    const user = await this.requireUser(principal.id, true);
    const expectedChallenge = await this.challenges.get<string>(
      registrationKey(user.id),
    );
    if (!expectedChallenge) {
      throw new BadRequestException(
        'Registration challenge expired; start again',
      );
    }

    const verification = await verifyRegistrationResponse({
      response: dto.response as unknown as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: this.allowedOrigins,
      expectedRPID: this.rpId,
      requireUserPresence: true,
    });
    await this.challenges.delete(registrationKey(user.id));

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Passkey verification failed');
    }
    const { credential } = verification.registrationInfo;
    const existing = await this.prisma.webauthnCredential.findUnique({
      where: { credentialId: credential.id },
    });
    if (existing) {
      throw new ConflictException('This passkey is already registered');
    }

    await this.prisma.webauthnCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        signCount: credential.counter,
        transports:
          (dto.response as unknown as { response?: { transports?: string[] } })
            .response?.transports ?? [],
        nickname: this.credentialNickname(user),
      },
    });

    return { verified: true, credentialId: credential.id };
  }

  async loginOptions(dto: PasskeyLoginOptionsDto): Promise<unknown> {
    if (!this.passkeyLoginEnabled) {
      throw new ForbiddenException('Passkey login is disabled');
    }
    const allowCredentials: { id: string; transports?: string[] }[] = [];
    let scopedUserId: string | null = null;

    if (dto.email) {
      const user = await this.requireUserByEmail(dto.email);
      const credentials = await this.prisma.webauthnCredential.findMany({
        where: { userId: user.id },
        select: { credentialId: true, transports: true },
      });
      if (credentials.length === 0) {
        throw new UnauthorizedException(
          'No passkeys registered for this account',
        );
      }
      allowCredentials.push(
        ...credentials.map((credential) => ({
          id: credential.credentialId,
          transports:
            credential.transports.length > 0
              ? credential.transports
              : (undefined as never),
        })),
      );
      scopedUserId = user.id;
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials:
        allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: 'required',
    });
    await this.challenges.set<AuthChallengeEntry>(
      authChallengeKey(options.challenge),
      { userId: scopedUserId },
      CHALLENGE_TTL_SECONDS,
    );
    return options;
  }

  async loginVerify(
    dto: PasskeyLoginVerifyDto,
    metadata: SessionMetadata = {},
  ): Promise<TokenResponseEntity> {
    if (!this.passkeyLoginEnabled) {
      throw new ForbiddenException('Passkey login is disabled');
    }
    const response = dto.response as unknown as AuthenticationResponseJSON;
    const credential = await this.prisma.webauthnCredential.findUnique({
      where: { credentialId: response.id },
    });
    if (!credential) {
      throw new UnauthorizedException('Unrecognized passkey');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: credential.userId },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Account is not available');
    }

    const challenge = this.challengeFromResponse(response);
    const entry = await this.challenges.get<AuthChallengeEntry>(
      authChallengeKey(challenge),
    );
    if (!entry) {
      throw new UnauthorizedException(
        'Passkey login challenge expired; start again',
      );
    }
    if (entry.userId && entry.userId !== user.id) {
      throw new UnauthorizedException(
        'Passkey does not belong to this account',
      );
    }
    await this.challenges.delete(authChallengeKey(challenge));

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.allowedOrigins,
      expectedRPID: this.rpId,
      credential: {
        id: credential.credentialId,
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: Number(credential.signCount),
        transports: credential.transports,
      },
      requireUserVerification: true,
    });
    if (!verification.verified) {
      throw new UnauthorizedException('Passkey verification failed');
    }

    await this.prisma.webauthnCredential.update({
      where: { id: credential.id },
      data: {
        signCount: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    return this.auth.createAuthResponse(user, metadata);
  }

  private async requireUser(userId: string, needsWebauthnId: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) {
      throw new UnauthorizedException();
    }
    if (needsWebauthnId && !user.webauthnId) {
      throw new BadRequestException('Account is missing its passkey identity');
    }
    return user;
  }

  private async requireUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.active || !user.webauthnId) {
      throw new UnauthorizedException('Unknown account');
    }
    return user;
  }

  private challengeFromResponse(response: AuthenticationResponseJSON): string {
    try {
      const clientData = JSON.parse(
        isoBase64URL.toUTF8String(response.response.clientDataJSON),
      ) as { challenge?: string };
      if (!clientData.challenge) {
        throw new Error('missing challenge');
      }
      return clientData.challenge;
    } catch {
      throw new BadRequestException('Invalid passkey client data');
    }
  }

  private credentialNickname(user: {
    email: string | null;
    firstName: string | null;
  }): string {
    const name = user.firstName?.trim();
    return name ? `${name}'s passkey` : (user.email ?? 'Passkey');
  }
}
