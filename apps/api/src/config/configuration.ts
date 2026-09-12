export interface DatabaseConfig {
  /** Postgres connection string (DATABASE_URL, else derived from the DB_/POSTGRES_ pair). */
  url: string;
}

export interface RedisConfig {
  /** Provided by REDIS_URL (Sentinel config is out of scope until Milestone 4). */
  url: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  /** TLS options for rediss:// endpoints. */
  tls?: { rejectUnauthorized: boolean };
}

export interface SecretsConfig {
  /** Session/JWT signing secret (`SECRET_KEY_BASE` in Sure). */
  sessionJwt: string;
}

export interface AppConfig {
  domain: string;
  productName: string;
  brandName: string;
}

export interface SmtpConfig {
  address: string;
  port: number;
  username: string;
  password: string;
  tlsEnabled: boolean;
  tlsSkipVerify: boolean;
  sender: string;
}

export interface AuthConfig {
  selfHosted: boolean;
  onboardingState: 'open' | 'closed' | 'invite_only';
  webauthnRpId: string;
  webauthnAllowedOrigins: string[];
  passkeyLoginEnabled: boolean;
  oidc: {
    clientId: string;
    clientSecret: string;
    issuer: string;
    redirectUri: string;
  };
  jwt: {
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
  };
}

export interface AiConfig {
  openaiAccessToken: string;
  openaiModel: string;
  openaiUriBase: string;
  vectorStoreProvider: 'openai' | 'pgvector' | 'qdrant';
  embeddingModel: string;
  embeddingUriBase: string;
  embeddingDimensions: number;
  langfuseHost: string;
  langfusePublicKey: string;
  langfuseSecretKey: string;
}

export interface StorageConfig {
  service: 'disk' | 'amazon' | 'cloudflare' | 'generic_s3' | 'google';
  amazon: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  cloudflare: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
  genericS3: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint: string;
    forcePathStyle: boolean;
  };
  google: {
    project: string;
    bucket: string;
    keyfileJson: string;
    keyfile: string;
  };
}

export interface MarketDataConfig {
  twelveDataApiKey: string;
  exchangeRateProvider: 'twelve_data' | 'yahoo_finance';
  securitiesProvider: 'twelve_data' | 'yahoo_finance';
}

export interface ObservabilityConfig {
  posthogKey: string;
  posthogHost: string;
  skylightAuthentication: string;
  skylightEnabled: string;
}

export interface Configuration {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  secrets: SecretsConfig;
  app: AppConfig;
  smtp: SmtpConfig;
  auth: AuthConfig;
  ai: AiConfig;
  storage: StorageConfig;
  marketData: MarketDataConfig;
  observability: ObservabilityConfig;
}

const parseBool = (value: string | undefined): boolean =>
  value?.toLowerCase() === 'true' || value === '1';

const parseIntStrict = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseCommaList = (value: string | undefined): string[] =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const redisConfig = (value: string | undefined): RedisConfig => {
  if (!value) {
    return {
      url: 'redis://localhost:6379/1',
      host: 'localhost',
      port: 6379,
    };
  }
  try {
    const uri = new URL(value);
    const isTls = uri.protocol === 'rediss:';
    return {
      url: value,
      host: uri.hostname,
      port: Number.parseInt(uri.port, 10) || 6379,
      username: uri.username ? decodeURIComponent(uri.username) : undefined,
      password: uri.password ? decodeURIComponent(uri.password) : undefined,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return {
      url: value,
      host: 'localhost',
      port: 6379,
    };
  }
};

const databaseUrl = (): string =>
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? 'postgres'}:${process.env.POSTGRES_PASSWORD ?? ''}@${
    process.env.DB_HOST ?? 'localhost'
  }:${parseIntStrict(process.env.DB_PORT, 5432)}/sure_selfhost`;

export const configuration = (): Configuration => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseIntStrict(process.env.PORT, 3000),
  database: {
    url: databaseUrl(),
  },
  redis: redisConfig(process.env.REDIS_URL),
  secrets: {
    sessionJwt: process.env.SECRET_KEY_BASE ?? '',
  },
  app: {
    domain: process.env.APP_DOMAIN ?? '',
    productName: process.env.PRODUCT_NAME ?? 'Spend Book',
    brandName: process.env.BRAND_NAME ?? 'Spend Book',
  },
  smtp: {
    address: process.env.SMTP_ADDRESS ?? '',
    port: parseIntStrict(process.env.SMTP_PORT, 465),
    username: process.env.SMTP_USERNAME ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    tlsEnabled: parseBool(process.env.SMTP_TLS_ENABLED ?? 'true'),
    tlsSkipVerify: parseBool(process.env.SMTP_TLS_SKIP_VERIFY ?? 'false'),
    sender: process.env.EMAIL_SENDER ?? '',
  },
  auth: {
    selfHosted: parseBool(process.env.SELF_HOSTED ?? 'true'),
    onboardingState: (process.env.ONBOARDING_STATE ?? 'open') as
      'open' | 'closed' | 'invite_only',
    webauthnRpId: process.env.WEBAUTHN_RP_ID ?? '',
    webauthnAllowedOrigins: parseCommaList(
      process.env.WEBAUTHN_ALLOWED_ORIGINS,
    ),
    passkeyLoginEnabled: parseBool(
      process.env.AUTH_PASSKEY_LOGIN_ENABLED ?? 'true',
    ),
    jwt: {
      accessTokenTtlSeconds: parseIntStrict(
        process.env.JWT_ACCESS_TTL_SECONDS,
        900,
      ),
      refreshTokenTtlSeconds: parseIntStrict(
        process.env.JWT_REFRESH_TTL_SECONDS,
        2_592_000,
      ),
    },
    oidc: {
      clientId: process.env.OIDC_CLIENT_ID ?? '',
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
      issuer: process.env.OIDC_ISSUER ?? '',
      redirectUri: process.env.OIDC_REDIRECT_URI ?? '',
    },
  },
  ai: {
    openaiAccessToken: process.env.OPENAI_ACCESS_TOKEN ?? '',
    openaiModel: process.env.OPENAI_MODEL ?? '',
    openaiUriBase: process.env.OPENAI_URI_BASE ?? '',
    vectorStoreProvider: (process.env.VECTOR_STORE_PROVIDER ?? 'openai') as
      'openai' | 'pgvector' | 'qdrant',
    embeddingModel: process.env.EMBEDDING_MODEL ?? '',
    embeddingUriBase: process.env.EMBEDDING_URI_BASE ?? '',
    embeddingDimensions: parseIntStrict(process.env.EMBEDDING_DIMENSIONS, 1024),
    langfuseHost: process.env.LANGFUSE_HOST ?? '',
    langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
    langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
  },
  storage: {
    service: (process.env.ACTIVE_STORAGE_SERVICE ?? 'disk') as
      'disk' | 'amazon' | 'cloudflare' | 'generic_s3' | 'google',
    amazon: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? '',
    },
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ?? '',
      bucket: process.env.CLOUDFLARE_BUCKET ?? '',
    },
    genericS3: {
      accessKeyId: process.env.GENERIC_S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.GENERIC_S3_SECRET_ACCESS_KEY ?? '',
      region: process.env.GENERIC_S3_REGION ?? '',
      bucket: process.env.GENERIC_S3_BUCKET ?? '',
      endpoint: process.env.GENERIC_S3_ENDPOINT ?? '',
      forcePathStyle: parseBool(process.env.GENERIC_S3_FORCE_PATH_STYLE),
    },
    google: {
      project: process.env.GCS_PROJECT ?? '',
      bucket: process.env.GCS_BUCKET ?? '',
      keyfileJson: process.env.GCS_KEYFILE_JSON ?? '',
      keyfile: process.env.GCS_KEYFILE ?? '',
    },
  },
  marketData: {
    twelveDataApiKey: process.env.TWELVE_DATA_API_KEY ?? '',
    exchangeRateProvider: (process.env.EXCHANGE_RATE_PROVIDER ??
      'yahoo_finance') as 'twelve_data' | 'yahoo_finance',
    securitiesProvider: (process.env.SECURITIES_PROVIDER ?? 'yahoo_finance') as
      'twelve_data' | 'yahoo_finance',
  },
  observability: {
    posthogKey: process.env.POSTHOG_KEY ?? '',
    posthogHost: process.env.POSTHOG_HOST ?? '',
    skylightAuthentication: process.env.SKYLIGHT_AUTHENTICATION ?? '',
    skylightEnabled: process.env.SKYLIGHT_ENABLED ?? '',
  },
  logging: {
    filePath: process.env.LOG_FILE_PATH ?? 'logs/app.log',
  },
});
