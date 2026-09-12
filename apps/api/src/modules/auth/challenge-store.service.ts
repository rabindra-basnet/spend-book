import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/** Persistence abstraction for short-lived webauthn/MFA challenges. */
export interface ChallengeStore {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export const CHALLENGE_STORE = Symbol('CHALLENGE_STORE');

/** Challenge store backed by Redis (shares the REDIS_URL connection settings). */
@Injectable()
export class RedisChallengeStore implements ChallengeStore, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.get<string>('redis.host') ?? 'localhost',
      port: config.get<number>('redis.port') ?? 6379,
      username: config.get<string>('redis.username') ?? undefined,
      password: config.get<string>('redis.password') ?? undefined,
      tls: config.get('redis.tls') ?? undefined,
      maxRetriesPerRequest: null,
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
