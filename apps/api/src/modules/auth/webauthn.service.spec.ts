import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthService } from './auth.service.js';
import { CHALLENGE_STORE } from './challenge-store.service.js';
import { WebauthnService } from './webauthn.service.js';

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

const configValues: Record<string, unknown> = {
  'auth.webauthnRpId': 'spendbook.local',
  'auth.webauthnAllowedOrigins': ['https://app.spendbook.local'],
  'auth.passkeyLoginEnabled': true,
  'app.productName': 'Spend Book',
};

const principal = {
  id: 'user-1',
  email: 'ada@example.com',
  role: 'member',
  familyId: 'family-1',
};

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  familyId: 'family-1',
  active: true,
  webauthnId: 'dGVzdC1pZA',
  otpRequired: false,
  ...overrides,
});

const makeCredential = (overrides: Record<string, unknown> = {}) => ({
  id: 'webauthn-cred-1',
  userId: 'user-1',
  credentialId: 'cred-1',
  publicKey: 'base64url-public-key',
  signCount: 1n,
  transports: [],
  ...overrides,
});

describe('WebauthnService', () => {
  let service: WebauthnService;
  const prisma = {
    user: { findUnique: vi.fn() },
    webauthnCredential: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const auth = { createAuthResponse: vi.fn() };
  const config = {
    get: vi.fn((key: string) => configValues[key]),
  };
  const challenges = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WebauthnService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
        { provide: ConfigService, useValue: config },
        { provide: CHALLENGE_STORE, useValue: challenges },
      ],
    }).compile();
    service = module.get(WebauthnService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registrationOptions', () => {
    it('builds options scoped to the user and stores the challenge', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.webauthnCredential.findMany.mockResolvedValue([
        { credentialId: 'existing', transports: ['internal'] },
      ]);
      const options = { challenge: 'reg-challenge', rpId: 'spendbook.local' };
      vi.mocked(generateRegistrationOptions).mockResolvedValue(
        options as never,
      );

      const result = await service.registrationOptions(principal);

      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'spendbook.local',
          userName: 'ada@example.com',
          excludeCredentials: [{ id: 'existing', transports: ['internal'] }],
        }),
      );
      expect(challenges.set).toHaveBeenCalledWith(
        'auth:wa:reg:user-1',
        'reg-challenge',
        300,
      );
      expect(result).toEqual(options);
    });

    it('requires a webauthn identity', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ webauthnId: null }));
      await expect(
        service.registrationOptions(principal),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyRegistration', () => {
    const body = {
      response: { id: 'cred-2', response: { transports: ['hybrid'] } },
    };

    it('persists a verified credential', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue('reg-challenge');
      prisma.webauthnCredential.findUnique.mockResolvedValue(null);
      prisma.webauthnCredential.create.mockResolvedValue({});
      const publicKey = new Uint8Array([1, 2, 3]);
      vi.mocked(verifyRegistrationResponse).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'cred-2', publicKey, counter: 7 },
        },
      } as never);

      const result = await service.verifyRegistration(principal, body as never);

      expect(result).toEqual({ verified: true, credentialId: 'cred-2' });
      expect(challenges.delete).toHaveBeenCalledWith('auth:wa:reg:user-1');
      const data = prisma.webauthnCredential.create.mock.calls[0][0].data;
      expect(data.credentialId).toBe('cred-2');
      expect(data.publicKey).toBe(isoBase64URL.fromBuffer(publicKey));
      expect(data.signCount).toBe(7);
      expect(data.transports).toEqual(['hybrid']);
    });

    it('rejects an expired challenge', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue(null);
      await expect(
        service.verifyRegistration(principal, { response: {} } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a already-registered passkey', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue('reg-challenge');
      prisma.webauthnCredential.findUnique.mockResolvedValue(makeCredential());
      await expect(
        service.verifyRegistration(principal, {
          response: { id: 'cred-2' },
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('loginOptions', () => {
    it('returns usernameless options when no email is given', async () => {
      const options = { challenge: 'login-challenge', rpId: 'spendbook.local' };
      vi.mocked(generateAuthenticationOptions).mockResolvedValue(
        options as never,
      );

      const result = await service.loginOptions({});

      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: undefined,
          userVerification: 'required',
        }),
      );
      expect(challenges.set).toHaveBeenCalledWith(
        'auth:wa:auth:login-challenge',
        { userId: null },
        300,
      );
      expect(result).toEqual(options);
    });

    it('scopes options to an email address', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.webauthnCredential.findMany.mockResolvedValue([
        { credentialId: 'cred-1', transports: [] },
      ]);
      vi.mocked(generateAuthenticationOptions).mockResolvedValue({
        challenge: 'login-challenge',
      } as never);

      await service.loginOptions({ email: 'Ada@example.com' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
      });
      expect(challenges.set).toHaveBeenCalledWith(
        'auth:wa:auth:login-challenge',
        { userId: 'user-1' },
        300,
      );
    });

    it('is disabled when configured', async () => {
      configValues['auth.passkeyLoginEnabled'] = false;
      await expect(service.loginOptions({})).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      configValues['auth.passkeyLoginEnabled'] = true;
    });
  });

  describe('loginVerify', () => {
    const clientDataJSON = isoBase64URL.fromUTF8String(
      JSON.stringify({ type: 'webauthn.get', challenge: 'login-challenge' }),
    );
    const assertion = {
      id: 'cred-1',
      rawId: 'cred-1',
      response: { clientDataJSON, authenticatorData: 'ad', signature: 'sig' },
      clientExtensionResults: {},
      type: 'public-key',
    } as unknown as RegistrationResponseJSON;

    it('verifies an assertion and completes login', async () => {
      prisma.webauthnCredential.findUnique.mockResolvedValue(makeCredential());
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue({ userId: 'user-1' });
      vi.mocked(verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 11 },
      } as never);
      auth.createAuthResponse.mockResolvedValue({ accessToken: 'access' });

      const result = await service.loginVerify(
        { response: assertion },
        { ipAddress: '10.0.0.1' },
      );

      expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'login-challenge',
          expectedRPID: 'spendbook.local',
          credential: expect.objectContaining({
            id: 'cred-1',
            counter: 1,
            publicKey: isoBase64URL.toBuffer('base64url-public-key'),
          }),
        }),
      );
      expect(prisma.webauthnCredential.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            signCount: 11,
            lastUsedAt: expect.any(Date),
          }),
        }),
      );
      expect(auth.createAuthResponse).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' }),
        { ipAddress: '10.0.0.1' },
      );
      expect(result).toEqual({ accessToken: 'access' });
    });

    it('rejects an unrecognized credential', async () => {
      prisma.webauthnCredential.findUnique.mockResolvedValue(null);
      await expect(
        service.loginVerify({ response: assertion }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a challenge that was scoped to another user', async () => {
      prisma.webauthnCredential.findUnique.mockResolvedValue(makeCredential());
      prisma.user.findUnique.mockResolvedValue(makeUser());
      challenges.get.mockResolvedValue({ userId: 'someone-else' });
      await expect(
        service.loginVerify({ response: assertion }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
