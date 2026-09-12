import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PoliciesGuard } from '../../common/guards/policies.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  CHALLENGE_STORE,
  RedisChallengeStore,
} from './challenge-store.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { WebauthnService } from './webauthn.service.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('secrets.sessionJwt'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    WebauthnService,
    JwtStrategy,
    { provide: CHALLENGE_STORE, useClass: RedisChallengeStore },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
  exports: [AuthService, WebauthnService],
})
export class AuthModule {}
