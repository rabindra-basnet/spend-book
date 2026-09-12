import { describe, expect, it } from 'vitest';
import { configuration } from './configuration.js';
import { validate } from './validation.schema.js';

describe('configuration factory', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    process.env = originalEnv;
  });

  it('derives a Postgres URL from the DB_/POSTGRES_ pair', () => {
    process.env = {
      ...originalEnv,
      DB_HOST: 'db.example.com',
      DB_PORT: '5433',
      POSTGRES_USER: 'sure',
      POSTGRES_PASSWORD: 'pw',
    };
    delete process.env.DATABASE_URL;
    expect(configuration().database.url).toBe(
      'postgresql://sure:pw@db.example.com:5433/sure_selfhost',
    );
  });

  it('prefers DATABASE_URL when set', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://u:p@h:5432/custom',
    };
    expect(configuration().database.url).toBe('postgresql://u:p@h:5432/custom');
  });

  it('applies defaults for optional groups', () => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    const config = configuration();
    expect(config.port).toBe(3000);
    expect(config.redis.url).toBe('redis://localhost:6379/1');
    expect(config.marketData.exchangeRateProvider).toBe('yahoo_finance');
    expect(config.storage.service).toBe('disk');
  });
});

describe('env validation', () => {
  it('throws with a readable message on invalid values', () => {
    expect(() => validate({ PORT: 'abc', SELF_HOSTED: 'banana' })).toThrow(
      /PORT must be a number string/,
    );
    expect(() => validate({ PORT: 'abc', SELF_HOSTED: 'banana' })).toThrow(
      /SELF_HOSTED must be "true" or "false"/,
    );
  });

  it('requires SECRET_KEY_BASE outside tests', () => {
    expect(() => validate({ NODE_ENV: 'development' })).toThrow(
      /SECRET_KEY_BASE is required/,
    );
  });

  it('accepts a valid env and strips unknown keys', () => {
    const result = validate({
      NODE_ENV: 'development',
      PORT: '4000',
      SECRET_KEY_BASE: 'x'.repeat(64),
      SELF_HOSTED: 'true',
      UNSUPPORTED_FUTURE_VAR: 'ignored',
    });
    expect(result.PORT).toBe('4000');
    expect(result).not.toHaveProperty('UNSUPPORTED_FUTURE_VAR');
  });
});
