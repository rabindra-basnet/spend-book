import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

const ONBOARDING_STATES = ['open', 'closed', 'invite_only'] as const;
const STORAGE_SERVICES = [
  'disk',
  'amazon',
  'cloudflare',
  'generic_s3',
  'google',
] as const;
const MARKET_DATA_PROVIDERS = ['twelve_data', 'yahoo_finance'] as const;
const VECTOR_STORE_PROVIDERS = ['openai', 'pgvector', 'qdrant'] as const;
const BOOLEAN_STRINGS = ['true', 'false', '1', '0'] as const;

export class EnvironmentVariables {
  @IsOptional()
  @IsEnum(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV !== 'test')
  @IsString()
  @IsNotEmpty({ message: 'SECRET_KEY_BASE is required when not running tests' })
  @MinLength(32, {
    message:
      'SECRET_KEY_BASE must be at least 32 characters (generate with `openssl rand -hex 64`)',
  })
  SECRET_KEY_BASE?: string;

  @IsOptional()
  @IsBooleanString({ message: 'SELF_HOSTED must be "true" or "false"' })
  SELF_HOSTED?: string;

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string;

  @IsOptional()
  @IsIn(ONBOARDING_STATES, {
    message: 'ONBOARDING_STATE must be one of open, closed, invite_only',
  })
  ONBOARDING_STATE?: string;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsNumberString()
  DB_PORT?: string;

  @IsOptional()
  @IsString()
  POSTGRES_USER?: string;

  @IsOptional()
  @IsString()
  POSTGRES_PASSWORD?: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsNumberString()
  JWT_ACCESS_TTL_SECONDS?: string;

  @IsOptional()
  @IsNumberString()
  JWT_REFRESH_TTL_SECONDS?: string;

  @IsOptional()
  @IsString()
  APP_DOMAIN?: string;

  @IsOptional()
  @IsString()
  PRODUCT_NAME?: string;

  @IsOptional()
  @IsString()
  BRAND_NAME?: string;

  @IsOptional()
  @IsString()
  SMTP_ADDRESS?: string;

  @IsOptional()
  @IsNumberString()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_USERNAME?: string;

  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  @IsOptional()
  @IsBooleanString({ message: 'SMTP_TLS_ENABLED must be "true" or "false"' })
  SMTP_TLS_ENABLED?: string;

  @IsOptional()
  @IsBooleanString({
    message: 'SMTP_TLS_SKIP_VERIFY must be "true" or "false"',
  })
  SMTP_TLS_SKIP_VERIFY?: string;

  @IsOptional()
  @IsString()
  EMAIL_SENDER?: string;

  @IsOptional()
  @IsString()
  WEBAUTHN_RP_ID?: string;

  @IsOptional()
  @IsString()
  WEBAUTHN_ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsBooleanString({
    message: 'AUTH_PASSKEY_LOGIN_ENABLED must be "true" or "false"',
  })
  AUTH_PASSKEY_LOGIN_ENABLED?: string;

  @IsOptional()
  @IsString()
  OIDC_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  OIDC_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  OIDC_ISSUER?: string;

  @IsOptional()
  @IsString()
  OIDC_REDIRECT_URI?: string;

  @IsOptional()
  @IsString()
  OPENAI_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsString()
  OPENAI_MODEL?: string;

  @IsOptional()
  @IsString()
  OPENAI_URI_BASE?: string;

  @IsOptional()
  @IsIn(VECTOR_STORE_PROVIDERS, {
    message: 'VECTOR_STORE_PROVIDER must be one of openai, pgvector, qdrant',
  })
  VECTOR_STORE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  EMBEDDING_MODEL?: string;

  @IsOptional()
  @IsString()
  EMBEDDING_URI_BASE?: string;

  @IsOptional()
  @IsNumberString()
  EMBEDDING_DIMENSIONS?: string;

  @IsOptional()
  @IsString()
  LANGFUSE_HOST?: string;

  @IsOptional()
  @IsString()
  LANGFUSE_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  LANGFUSE_SECRET_KEY?: string;

  @IsOptional()
  @IsIn(STORAGE_SERVICES, {
    message:
      'ACTIVE_STORAGE_SERVICE must be one of disk, amazon, cloudflare, generic_s3, google',
  })
  ACTIVE_STORAGE_SERVICE?: string;

  @IsOptional()
  @IsString()
  S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  S3_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  S3_REGION?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  CLOUDFLARE_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  CLOUDFLARE_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  CLOUDFLARE_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  CLOUDFLARE_BUCKET?: string;

  @IsOptional()
  @IsString()
  GENERIC_S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  GENERIC_S3_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  GENERIC_S3_REGION?: string;

  @IsOptional()
  @IsString()
  GENERIC_S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  GENERIC_S3_ENDPOINT?: string;

  @IsOptional()
  @IsIn(BOOLEAN_STRINGS, {
    message: 'GENERIC_S3_FORCE_PATH_STYLE must be "true" or "false"',
  })
  GENERIC_S3_FORCE_PATH_STYLE?: string;

  @IsOptional()
  @IsString()
  GCS_PROJECT?: string;

  @IsOptional()
  @IsString()
  GCS_BUCKET?: string;

  @IsOptional()
  @IsString()
  GCS_KEYFILE_JSON?: string;

  @IsOptional()
  @IsString()
  GCS_KEYFILE?: string;

  @IsOptional()
  @IsString()
  TWELVE_DATA_API_KEY?: string;

  @IsOptional()
  @IsIn(MARKET_DATA_PROVIDERS, {
    message: 'EXCHANGE_RATE_PROVIDER must be one of twelve_data, yahoo_finance',
  })
  EXCHANGE_RATE_PROVIDER?: string;

  @IsOptional()
  @IsIn(MARKET_DATA_PROVIDERS, {
    message: 'SECURITIES_PROVIDER must be one of twelve_data, yahoo_finance',
  })
  SECURITIES_PROVIDER?: string;

  @IsOptional()
  @IsString()
  POSTHOG_KEY?: string;

  @IsOptional()
  @IsString()
  POSTHOG_HOST?: string;

  @IsOptional()
  @IsString()
  SKYLIGHT_AUTHENTICATION?: string;

  @IsOptional()
  @IsString()
  SKYLIGHT_ENABLED?: string;
}

export const validate = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, {
    whitelist: true,
    forbidNonWhitelisted: false,
    validationError: { target: false, value: false },
  });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join('; '))
      .join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }
  return validated as unknown as Record<string, unknown>;
};
