-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ok', 'syncing', 'error');

-- CreateEnum
CREATE TYPE "goal_pledge_kind" AS ENUM ('transfer', 'manual_save');

-- CreateEnum
CREATE TYPE "goal_pledge_status" AS ENUM ('open', 'matched', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "account_share_permission" AS ENUM ('full_control', 'read_write', 'read_only');

-- CreateEnum
CREATE TYPE "account_statement_review_status" AS ENUM ('unmatched', 'linked', 'rejected');

-- CreateEnum
CREATE TYPE "account_statement_upload_status" AS ENUM ('stored', 'failed');

-- CreateEnum
CREATE TYPE "debug_log_level" AS ENUM ('debug', 'info', 'warn', 'error');

-- CreateEnum
CREATE TYPE "family_default_account_sharing" AS ENUM ('shared', 'private');

-- CreateEnum
CREATE TYPE "goal_kind" AS ENUM ('one_off', 'maintained');

-- CreateEnum
CREATE TYPE "goal_progress_basis" AS ENUM ('balance', 'contributions');

-- CreateEnum
CREATE TYPE "goal_state" AS ENUM ('active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "goal_target_mode" AS ENUM ('fixed', 'months_of_expenses');

-- CreateEnum
CREATE TYPE "import_session_status" AS ENUM ('pending', 'importing', 'complete', 'failed');

-- CreateEnum
CREATE TYPE "resource_type" AS ENUM ('Account', 'Category', 'Tag', 'Merchant', 'RecurringTransaction', 'RecurringOccurrence', 'Transaction', 'Budget', 'Security', 'Rule');

-- CreateEnum
CREATE TYPE "insight_priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "insight_status" AS ENUM ('active', 'read', 'dismissed', 'expired');

-- CreateEnum
CREATE TYPE "onchain_asset_kind" AS ENUM ('native', 'erc20', 'spl');

-- CreateEnum
CREATE TYPE "avm_provider" AS ENUM ('rentcast', 'realie');

-- CreateEnum
CREATE TYPE "push_environment" AS ENUM ('sandbox', 'production');

-- CreateEnum
CREATE TYPE "recurrence_frequency" AS ENUM ('weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "recurring_allocation_source" AS ENUM ('auto_matched', 'user_confirmed', 'user_created');

-- CreateEnum
CREATE TYPE "recurring_allocation_state" AS ENUM ('suggested', 'confirmed');

-- CreateEnum
CREATE TYPE "recurring_occurrence_status" AS ENUM ('scheduled', 'paid', 'skipped', 'missed');

-- CreateEnum
CREATE TYPE "recurring_occurrence_closed_source" AS ENUM ('auto', 'user');

-- CreateEnum
CREATE TYPE "security_kind" AS ENUM ('standard', 'cash');

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aiPromptOverrides" JSONB NOT NULL DEFAULT '{}',
    "assistantType" VARCHAR(255) NOT NULL DEFAULT 'builtin',
    "autoSyncOnLogin" BOOLEAN NOT NULL DEFAULT true,
    "billsFeedToken" VARCHAR(255),
    "country" VARCHAR(255) NOT NULL DEFAULT 'US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" VARCHAR(255) NOT NULL DEFAULT 'USD',
    "dataEnrichmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dateFormat" VARCHAR(255) NOT NULL DEFAULT '%m-%d-%Y',
    "defaultAccountSharing" "family_default_account_sharing" NOT NULL DEFAULT 'shared',
    "earlyAccess" BOOLEAN NOT NULL DEFAULT false,
    "enabledCurrencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "householdBudgetEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAllAttemptedAt" TIMESTAMP(3),
    "latestSyncActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestSyncCompletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" VARCHAR(255) NOT NULL DEFAULT 'en',
    "moniker" VARCHAR(255) NOT NULL DEFAULT 'Family',
    "monthStartDay" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(255),
    "personalBudgets" BOOLEAN NOT NULL DEFAULT false,
    "recurringTransactionsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" VARCHAR(255),
    "timezone" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vectorStoreId" VARCHAR(255),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defaultAccountId" UUID,
    "defaultAccountOrder" VARCHAR(255) NOT NULL DEFAULT 'name_asc',
    "defaultPeriod" VARCHAR(255) NOT NULL DEFAULT 'last_30_days',
    "email" VARCHAR(255),
    "familyId" UUID NOT NULL,
    "firstName" VARCHAR(255),
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "lastName" VARCHAR(255),
    "lastViewedChatId" UUID,
    "locale" VARCHAR(255),
    "onboardedAt" TIMESTAMP(3),
    "otpBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "otpRequired" BOOLEAN NOT NULL DEFAULT false,
    "otpSecret" VARCHAR(255),
    "passwordDigest" VARCHAR(255),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "role" VARCHAR(255) NOT NULL DEFAULT 'member',
    "rulePromptDismissedAt" TIMESTAMP(3),
    "rulePromptsDisabled" BOOLEAN NOT NULL DEFAULT false,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "setOnboardingGoalsAt" TIMESTAMP(3),
    "setOnboardingPreferencesAt" TIMESTAMP(3),
    "showAiSidebar" BOOLEAN NOT NULL DEFAULT true,
    "showSidebar" BOOLEAN NOT NULL DEFAULT true,
    "theme" VARCHAR(255) NOT NULL DEFAULT 'system',
    "uiLayout" VARCHAR(255),
    "unconfirmedEmail" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "webauthnId" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255),
    "expiresAt" TIMESTAMP(3),
    "familyId" UUID NOT NULL,
    "inviterId" UUID NOT NULL,
    "role" VARCHAR(255),
    "token" VARCHAR(255),
    "tokenDigest" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" VARCHAR(255) NOT NULL,
    "tokenDigest" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "activeImpersonatorSessionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB DEFAULT '{}',
    "ipAddress" VARCHAR(255),
    "ipAddressDigest" VARCHAR(255),
    "prevTransactionPageParams" JSONB DEFAULT '{}',
    "subscribedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" VARCHAR(255),
    "userId" UUID NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appVersion" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" VARCHAR(255),
    "deviceName" VARCHAR(255),
    "deviceType" VARCHAR(255),
    "lastSeenAt" TIMESTAMP(3),
    "osVersion" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialId" VARCHAR(255) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "nickname" VARCHAR(255) NOT NULL,
    "publicKey" TEXT NOT NULL,
    "signCount" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayKey" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "name" VARCHAR(255),
    "revokedAt" TIMESTAMP(3),
    "scopes" JSONB,
    "source" VARCHAR(255) NOT NULL DEFAULT 'web',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment" "push_environment" NOT NULL,
    "lastRegisteredAt" TIMESTAMP(3) NOT NULL,
    "platform" VARCHAR(255) NOT NULL DEFAULT 'ios',
    "token" VARCHAR(255) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "info" JSONB DEFAULT '{}',
    "issuer" VARCHAR(255),
    "lastAuthenticatedAt" TIMESTAMP(3),
    "provider" VARCHAR(255) NOT NULL,
    "uid" VARCHAR(255) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "oidc_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impersonatedId" UUID NOT NULL,
    "impersonatorId" UUID NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_session_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" VARCHAR(255),
    "controller" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impersonationSessionId" UUID NOT NULL,
    "ipAddress" VARCHAR(255),
    "method" VARCHAR(255),
    "path" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "impersonation_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" TEXT,
    "var" VARCHAR(255) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount" DECIMAL(19,4),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" VARCHAR(255),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "familyId" UUID NOT NULL,
    "interval" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL,
    "stripeId" VARCHAR(255),
    "trialEndsAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" UUID NOT NULL,
    "providerType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "includeInFinances" BOOLEAN NOT NULL DEFAULT true,
    "permission" "account_share_permission" NOT NULL DEFAULT 'read_only',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "account_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_statements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID,
    "accountLast4Hint" VARCHAR(4),
    "accountNameHint" VARCHAR(200),
    "byteSize" BIGINT NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "closingBalance" DECIMAL(19,4),
    "contentSha256" TEXT,
    "contentType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" VARCHAR(3),
    "familyId" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "institutionNameHint" VARCHAR(200),
    "matchConfidence" DECIMAL(5,4),
    "openingBalance" DECIMAL(19,4),
    "parserConfidence" DECIMAL(5,4),
    "periodEndOn" DATE,
    "periodStartOn" DATE,
    "reviewStatus" "account_statement_review_status" NOT NULL DEFAULT 'unmatched',
    "sanitizedParserOutput" JSONB NOT NULL DEFAULT '{}',
    "source" VARCHAR(255) NOT NULL DEFAULT 'manual_upload',
    "suggestedAccountId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadStatus" "account_statement_upload_status" NOT NULL DEFAULT 'stored',

    CONSTRAINT "account_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountableId" UUID,
    "accountableType" TEXT,
    "accountProvidersCount" INTEGER NOT NULL DEFAULT 0,
    "balance" DECIMAL(19,4),
    "cashBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "classification" TEXT GENERATED ALWAYS AS (CASE WHEN "accountableType" = ANY (ARRAY['Loan'::text, 'CreditCard'::text, 'OtherLiability'::text]) THEN 'liability' ELSE 'asset' END) STORED,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "disabledAt" TIMESTAMP(3),
    "enableCategoryMatcher" BOOLEAN NOT NULL DEFAULT true,
    "excludeFromReports" BOOLEAN NOT NULL DEFAULT false,
    "familyId" UUID NOT NULL,
    "importId" UUID,
    "institutionDomain" TEXT,
    "institutionName" TEXT,
    "lockedAttributes" JSONB DEFAULT '{}',
    "name" TEXT,
    "notes" TEXT,
    "ownerId" UUID,
    "plaidAccountId" UUID,
    "simplefinAccountId" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "addressableId" UUID,
    "addressableType" TEXT,
    "country" TEXT,
    "county" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "line1" TEXT,
    "line2" TEXT,
    "locality" TEXT,
    "postalCode" TEXT,
    "region" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "balance" DECIMAL(19,4) NOT NULL,
    "cashAdjustments" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "cashBalance" DECIMAL(19,4) DEFAULT 0,
    "cashInflows" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "cashOutflows" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" DATE NOT NULL,
    "endBalance" DECIMAL(19,4) GENERATED ALWAYS AS ((("startCashBalance" + (("cashInflows" - "cashOutflows") * ("flowsFactor")::numeric)) + "cashAdjustments") + (("startNonCashBalance" + (("nonCashInflows" - "nonCashOutflows") * ("flowsFactor")::numeric)) + "netMarketFlows" + "nonCashAdjustments")) STORED,
    "endCashBalance" DECIMAL(19,4) GENERATED ALWAYS AS (("startCashBalance" + (("cashInflows" - "cashOutflows") * ("flowsFactor")::numeric)) + "cashAdjustments") STORED,
    "endNonCashBalance" DECIMAL(19,4) GENERATED ALWAYS AS (("startNonCashBalance" + (("nonCashInflows" - "nonCashOutflows") * ("flowsFactor")::numeric)) + "netMarketFlows" + "nonCashAdjustments") STORED,
    "flowsFactor" INTEGER NOT NULL DEFAULT 1,
    "netMarketFlows" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "nonCashAdjustments" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "nonCashInflows" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "nonCashOutflows" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "startBalance" DECIMAL(19,4) GENERATED ALWAYS AS ("startCashBalance" + "startNonCashBalance") STORED,
    "startCashBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "startNonCashBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "annualFee" DECIMAL(10,2),
    "apr" DECIMAL(10,2),
    "availableCredit" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" DATE,
    "lockedAttributes" JSONB DEFAULT '{}',
    "minimumPayment" DECIMAL(10,2),
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cryptos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "taxTreatment" TEXT NOT NULL DEFAULT 'taxable',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cryptos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depositories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_pairs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstProviderRateOn" DATE,
    "fromCurrency" TEXT NOT NULL,
    "providerName" TEXT,
    "toCurrency" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" DATE NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "accountProviderId" UUID,
    "amount" DECIMAL(19,4) NOT NULL,
    "costBasis" DECIMAL(19,4),
    "costBasisLocked" BOOLEAN NOT NULL DEFAULT false,
    "costBasisSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "externalId" TEXT,
    "price" DECIMAL(19,4) NOT NULL,
    "providerSecurityId" UUID,
    "qty" DECIMAL(34,18) NOT NULL,
    "securityId" UUID NOT NULL,
    "securityLocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialBalance" DECIMAL(19,4),
    "interestRate" DECIMAL(10,3),
    "lockedAttributes" JSONB DEFAULT '{}',
    "rateType" TEXT,
    "subtype" TEXT,
    "termMonths" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_liabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_liabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "areaUnit" TEXT,
    "areaValue" INTEGER,
    "avmLastSyncedOn" DATE,
    "avmProvider" "avm_provider",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "yearBuilt" INTEGER,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "securities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchangeAcronym" TEXT,
    "exchangeMic" TEXT,
    "exchangeOperatingMic" TEXT,
    "failedFetchAt" TIMESTAMP(3),
    "failedFetchCount" INTEGER NOT NULL DEFAULT 0,
    "firstProviderPriceOn" DATE,
    "kind" "security_kind" NOT NULL DEFAULT 'standard',
    "lastHealthCheckAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "name" TEXT,
    "offline" BOOLEAN NOT NULL DEFAULT false,
    "offlineReason" TEXT,
    "priceProvider" TEXT,
    "ticker" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "websiteUrl" TEXT,

    CONSTRAINT "securities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "date" DATE NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "provisional" BOOLEAN NOT NULL DEFAULT false,
    "securityId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "fee" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "investmentActivityLabel" TEXT,
    "lockedAttributes" JSONB DEFAULT '{}',
    "price" DECIMAL(19,10),
    "qty" DECIMAL(34,18),
    "securityId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL DEFAULT 'reconciliation',
    "lockedAttributes" JSONB DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAttributes" JSONB DEFAULT '{}',
    "make" TEXT,
    "mileageUnit" TEXT,
    "mileageValue" INTEGER,
    "model" TEXT,
    "subtype" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "year" INTEGER,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "date" DATE,
    "entryableId" UUID,
    "entryableType" TEXT,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "idempotencyKey" TEXT,
    "importId" UUID,
    "importLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAttributes" JSONB DEFAULT '{}',
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "parentEntryId" UUID,
    "plaidId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledByStatementId" UUID,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userModified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalId" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "investmentActivityLabel" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'standard',
    "lockedAttributes" JSONB DEFAULT '{}',
    "merchantId" UUID,
    "transferId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inflowTransactionId" UUID NOT NULL,
    "notes" TEXT,
    "outflowTransactionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rejected_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inflowTransactionId" UUID NOT NULL,
    "outflowTransactionId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rejected_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classificationUnused" TEXT NOT NULL DEFAULT 'expense',
    "color" TEXT NOT NULL DEFAULT '#6172F3',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "lucideIcon" TEXT NOT NULL DEFAULT 'shapes',
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID,
    "logoUrl" TEXT,
    "name" TEXT NOT NULL,
    "providerMerchantId" TEXT,
    "source" TEXT,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "websiteUrl" TEXT,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_merchant_associations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "merchantId" UUID NOT NULL,
    "unlinkedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_merchant_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "color" TEXT NOT NULL DEFAULT '#e99537',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "name" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taggings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagId" UUID NOT NULL,
    "taggableId" UUID,
    "taggableType" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taggings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" DATE,
    "familyId" UUID NOT NULL,
    "name" TEXT,
    "resourceType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conditionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operator" TEXT NOT NULL,
    "parentId" UUID,
    "ruleId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" TEXT,

    CONSTRAINT "rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" TEXT,

    CONSTRAINT "rule_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "executionType" TEXT NOT NULL,
    "pendingJobsCount" INTEGER NOT NULL DEFAULT 0,
    "ruleId" UUID NOT NULL,
    "ruleName" TEXT,
    "status" TEXT NOT NULL,
    "transactionsModified" INTEGER NOT NULL DEFAULT 0,
    "transactionsProcessed" INTEGER NOT NULL DEFAULT 0,
    "transactionsQueued" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID,
    "amount" DECIMAL(19,4) NOT NULL,
    "amountStrategy" TEXT NOT NULL DEFAULT 'fixed',
    "amountTolerancePct" DECIMAL(5,2) NOT NULL DEFAULT 7.5,
    "anchorDate" DATE,
    "autopay" BOOLEAN NOT NULL DEFAULT false,
    "billType" TEXT NOT NULL DEFAULT 'bill',
    "cancelledOn" DATE,
    "categoryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "dedupScope" TEXT NOT NULL DEFAULT '',
    "destinationAccountId" UUID,
    "endAfterCount" INTEGER,
    "endMode" TEXT NOT NULL DEFAULT 'never',
    "endOn" DATE,
    "expectedAmountAvg" DECIMAL(19,4),
    "expectedAmountMax" DECIMAL(19,4),
    "expectedAmountMin" DECIMAL(19,4),
    "expectedDayOfMonth" INTEGER NOT NULL,
    "familyId" UUID NOT NULL,
    "holidayCalendar" TEXT,
    "lastOccurrenceDate" DATE NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "matchDaysEarly" INTEGER NOT NULL DEFAULT 2,
    "matchDaysLate" INTEGER NOT NULL DEFAULT 7,
    "matcherHints" JSONB NOT NULL DEFAULT '{}',
    "merchantId" UUID,
    "name" TEXT,
    "nextExpectedDate" DATE NOT NULL,
    "notes" TEXT,
    "notifyDaysBefore" INTEGER,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "overdueGraceDays" INTEGER,
    "paymentUrl" TEXT,
    "renewsOn" DATE,
    "replacedById" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trialEndsOn" DATE,
    "upcomingWindowDays" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekendAdjust" TEXT NOT NULL DEFAULT 'none',

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dayOfMonth" INTEGER,
    "frequency" "recurrence_frequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "monthOfYear" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "recurringTransactionId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekday" INTEGER,
    "weekdayOrdinal" INTEGER,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_occurrences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "closedAt" TIMESTAMP(3),
    "closedSource" "recurring_occurrence_closed_source",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "dueOn" DATE NOT NULL,
    "expectedAmount" DECIMAL(19,4),
    "familyId" UUID NOT NULL,
    "notes" TEXT,
    "originalDueOn" DATE NOT NULL,
    "recurringTransactionId" UUID NOT NULL,
    "snoozedUntil" DATE,
    "status" "recurring_occurrence_status" NOT NULL DEFAULT 'scheduled',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "allocatedAmount" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "entryId" UUID,
    "matchConfidence" DECIMAL(5,4),
    "matchSignals" JSONB NOT NULL DEFAULT '{}',
    "paidOn" DATE,
    "recurringOccurrenceId" UUID NOT NULL,
    "source" "recurring_allocation_source" NOT NULL,
    "sourceAmount" DECIMAL(19,4),
    "sourceCurrency" TEXT,
    "state" "recurring_allocation_state" NOT NULL DEFAULT 'confirmed',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_match_rejections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryId" UUID NOT NULL,
    "recurringTransactionId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_match_rejections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_price_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "effectiveOn" DATE NOT NULL,
    "entryId" UUID,
    "newAmount" DECIMAL(19,4) NOT NULL,
    "previousAmount" DECIMAL(19,4) NOT NULL,
    "recurringTransactionId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_price_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "budgetedSpending" DECIMAL(19,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "endDate" DATE NOT NULL,
    "expectedIncome" DECIMAL(19,4),
    "familyId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "budgetId" UUID NOT NULL,
    "budgetedSpending" DECIMAL(19,4) NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "rolledOverAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "rolloverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" UUID NOT NULL,
    "permission" "account_share_permission" NOT NULL DEFAULT 'read_only',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "viewerId" UUID NOT NULL,

    CONSTRAINT "budget_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "color" TEXT,
    "completedAmount" DECIMAL(19,4),
    "completedAt" TIMESTAMP(3),
    "consumedAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "familyId" UUID NOT NULL,
    "icon" TEXT,
    "kind" "goal_kind" NOT NULL DEFAULT 'one_off',
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "progressBasis" "goal_progress_basis" NOT NULL DEFAULT 'balance',
    "state" "goal_state" NOT NULL DEFAULT 'active',
    "targetAmount" DECIMAL(19,4) NOT NULL,
    "targetDate" DATE,
    "targetMode" "goal_target_mode" NOT NULL DEFAULT 'fixed',
    "targetMonths" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "allocatedAmount" DECIMAL(19,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_pledges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "goalId" UUID NOT NULL,
    "kind" "goal_pledge_kind" NOT NULL,
    "matchedTransactionId" UUID,
    "status" "goal_pledge_status" NOT NULL DEFAULT 'open',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_pledges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountColLabel" TEXT,
    "accountId" UUID,
    "accountStatementId" UUID,
    "aiSummary" TEXT,
    "amountColLabel" TEXT,
    "amountTypeIdentifierValue" TEXT,
    "amountTypeInflowValue" TEXT,
    "amountTypeStrategy" TEXT NOT NULL DEFAULT 'signed_amount',
    "categoryColLabel" TEXT,
    "checksum" VARCHAR(64),
    "clientChunkId" VARCHAR(255),
    "colSep" TEXT NOT NULL DEFAULT ',',
    "columnMappings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currencyColLabel" TEXT,
    "dateColLabel" TEXT,
    "dateFormat" TEXT NOT NULL DEFAULT '%m/%d/%Y',
    "documentType" TEXT,
    "entityTypeColLabel" TEXT,
    "error" TEXT,
    "errorDetails" JSONB NOT NULL DEFAULT '{}',
    "exchangeOperatingMicColLabel" TEXT,
    "expectedRecordCounts" JSONB NOT NULL DEFAULT '{}',
    "extractedData" JSONB,
    "familyId" UUID NOT NULL,
    "importSessionId" UUID,
    "nameColLabel" TEXT,
    "normalizedCsvStr" TEXT,
    "notesColLabel" TEXT,
    "numberFormat" TEXT,
    "priceColLabel" TEXT,
    "qtyColLabel" TEXT,
    "rawFileStr" TEXT,
    "readbackVerification" JSONB NOT NULL DEFAULT '{}',
    "rowsCount" INTEGER NOT NULL DEFAULT 0,
    "rowsToSkip" INTEGER NOT NULL DEFAULT 0,
    "sequence" INTEGER,
    "signageConvention" TEXT NOT NULL DEFAULT 'inflows_positive',
    "status" TEXT,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "tagsColLabel" TEXT,
    "tickerColLabel" TEXT,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account" TEXT,
    "actions" TEXT,
    "active" BOOLEAN,
    "amount" TEXT,
    "category" TEXT,
    "categoryClassification" TEXT,
    "categoryColor" TEXT,
    "categoryIcon" TEXT,
    "categoryParent" TEXT,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "date" TEXT,
    "effectiveDate" TEXT,
    "entityType" TEXT,
    "exchangeOperatingMic" TEXT,
    "importId" UUID NOT NULL,
    "merchantColor" TEXT,
    "merchantWebsite" TEXT,
    "name" TEXT,
    "notes" TEXT,
    "price" TEXT,
    "qty" TEXT,
    "resourceType" TEXT,
    "sourceRowNumber" INTEGER NOT NULL,
    "tags" TEXT,
    "ticker" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createWhenEmpty" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importId" UUID NOT NULL,
    "key" TEXT,
    "mappableId" UUID,
    "mappableType" TEXT,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" TEXT,

    CONSTRAINT "import_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientSessionId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorDetails" JSONB NOT NULL DEFAULT '{}',
    "expectedChunks" INTEGER,
    "familyId" UUID NOT NULL,
    "importType" TEXT NOT NULL DEFAULT 'SureImport',
    "status" "import_session_status" NOT NULL DEFAULT 'pending',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_source_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "importSessionId" UUID NOT NULL,
    "sourceId" VARCHAR(255) NOT NULL,
    "sourceType" VARCHAR(64) NOT NULL,
    "targetId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_source_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archived_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloadTokenDigest" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "familyName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archived_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "fileSize" INTEGER,
    "filename" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "providerFileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syncs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cancelRequestedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,
    "error" TEXT,
    "failedAt" TIMESTAMP(3),
    "parentId" UUID,
    "pendingAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "syncStats" TEXT,
    "syncableId" UUID NOT NULL,
    "syncableType" TEXT NOT NULL,
    "syncingAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "windowEndDate" DATE,
    "windowStartDate" DATE,

    CONSTRAINT "syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" JSONB,
    "instructions" TEXT,
    "latestAssistantResponseId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aiModel" TEXT,
    "chatId" UUID NOT NULL,
    "content" TEXT,
    "debug" BOOLEAN NOT NULL DEFAULT false,
    "providerId" TEXT,
    "reasoning" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "functionArguments" JSONB,
    "functionName" TEXT,
    "functionResult" JSONB,
    "messageId" UUID NOT NULL,
    "providerCallId" TEXT,
    "providerId" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cacheCreationTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedCost" DECIMAL(10,6),
    "familyId" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT NOT NULL DEFAULT '',
    "operation" TEXT NOT NULL DEFAULT '',
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT '',
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "body" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dedupKey" TEXT NOT NULL DEFAULT '',
    "dismissedAt" TIMESTAMP(3),
    "facts" JSONB NOT NULL DEFAULT '{}',
    "familyId" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insightType" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "periodEnd" DATE,
    "periodStart" DATE,
    "priority" "insight_priority" NOT NULL DEFAULT 'medium',
    "readAt" TIMESTAMP(3),
    "status" "insight_status" NOT NULL DEFAULT 'active',
    "title" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_enrichments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attributeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrichableId" UUID NOT NULL,
    "enrichableType" TEXT NOT NULL,
    "metadata" JSONB,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" JSONB,

    CONSTRAINT "data_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debug_log_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID,
    "accountProviderId" UUID,
    "category" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID,
    "level" "debug_log_level" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "providerKey" TEXT,
    "source" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "debug_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_request_counts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL DEFAULT '',
    "providerKey" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_request_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_datasets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "evalType" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "name" TEXT NOT NULL DEFAULT '',
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "eval_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "evalDatasetId" UUID NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "model" TEXT NOT NULL DEFAULT '',
    "name" TEXT,
    "provider" TEXT NOT NULL DEFAULT '',
    "providerConfig" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalCompletionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(10,6),
    "totalPromptTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_samples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contextData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "evalDatasetId" UUID NOT NULL,
    "expectedOutput" JSONB NOT NULL,
    "inputData" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eval_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actualOutput" JSONB NOT NULL,
    "alternativeMatch" BOOLEAN NOT NULL DEFAULT false,
    "completionTokens" INTEGER,
    "correct" BOOLEAN NOT NULL,
    "cost" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evalRunId" UUID NOT NULL,
    "evalSampleId" UUID NOT NULL,
    "exactMatch" BOOLEAN NOT NULL DEFAULT false,
    "fuzzyScore" DOUBLE PRECISION,
    "hierarchicalMatch" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "nullExpected" BOOLEAN NOT NULL DEFAULT false,
    "nullReturned" BOOLEAN NOT NULL DEFAULT false,
    "promptTokens" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eval_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientId" TEXT,
    "clientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "issuer" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "redirectUri" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "strategy" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL DEFAULT '',
    "ipAddress" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "provider" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "userId" UUID,

    CONSTRAINT "sso_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_identity_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identityLabel" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT '',
    "uidDigest" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_identity_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "vector_store_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding" vector(1024) NOT NULL,
    "fileId" TEXT NOT NULL,
    "filename" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "storeId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vector_store_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akahu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userToken" TEXT,

    CONSTRAINT "akahu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "akahu_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "akahuItemId" UUID NOT NULL,
    "availableBalance" DECIMAL(19,4),
    "balanceLimit" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "formattedAccount" TEXT,
    "institutionMetadata" JSONB,
    "name" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "syncStartDate" DATE,

    CONSTRAINT "akahu_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "binance_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "binance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "binance_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountType" TEXT,
    "binanceItemId" UUID NOT NULL,
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "institutionMetadata" JSONB,
    "name" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "binance_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brex_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT NOT NULL,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "token" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brex_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brex_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT NOT NULL,
    "accountKind" TEXT NOT NULL DEFAULT 'cash',
    "accountLimit" DECIMAL(19,4),
    "accountStatus" TEXT,
    "accountType" TEXT,
    "availableBalance" DECIMAL(19,4),
    "brexItemId" UUID NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currentBalance" DECIMAL(19,4),
    "institutionMetadata" JSONB,
    "name" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,

    CONSTRAINT "brex_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinbase_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinbase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinbase_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "coinbaseItemId" UUID NOT NULL,
    "currency" TEXT,
    "currentBalance" DECIMAL(34,18),
    "institutionMetadata" JSONB,
    "name" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,

    CONSTRAINT "coinbase_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinstats_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchangeConnectionId" TEXT,
    "exchangePortfolioId" TEXT,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinstats_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinstats_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "coinstatsItemId" UUID NOT NULL,
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "institutionMetadata" JSONB,
    "name" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "walletAddress" TEXT,

    CONSTRAINT "coinstats_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enable_banking_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationId" TEXT,
    "aspspAuthApproach" TEXT,
    "aspspId" TEXT,
    "aspspMaximumConsentValidity" INTEGER,
    "aspspName" TEXT,
    "aspspPsuTypes" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "aspspRequiredPsuHeaders" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "authorizationId" TEXT,
    "clientCertificate" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "lastPsuIp" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "psuType" TEXT,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "sessionExpiresAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enable_banking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enable_banking_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "creditLimit" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "enableBankingItemId" UUID NOT NULL,
    "iban" TEXT,
    "identificationHashes" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "institutionMetadata" JSONB,
    "name" TEXT,
    "product" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "treatBalanceAsAvailableCredit" BOOLEAN NOT NULL DEFAULT false,
    "uid" TEXT,

    CONSTRAINT "enable_banking_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ibkr_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "queryId" TEXT,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "token" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ibkr_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ibkr_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "ibkrAccountId" TEXT,
    "ibkrItemId" UUID NOT NULL,
    "institutionMetadata" JSONB,
    "lastActivitiesSync" TIMESTAMP(3),
    "lastHoldingsSync" TIMESTAMP(3),
    "name" TEXT,
    "rawActivitiesPayload" JSONB NOT NULL DEFAULT '{}',
    "rawCashReportPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawEquitySummaryPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawHoldingsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "reportDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ibkr_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexa_capital_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiToken" TEXT,
    "document" TEXT,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "password" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "indexa_capital_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexa_capital_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountNumber" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "activitiesFetchPending" BOOLEAN NOT NULL DEFAULT false,
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "indexaCapitalAccountId" TEXT,
    "indexaCapitalAuthorizationId" TEXT,
    "indexaCapitalItemId" UUID NOT NULL,
    "institutionMetadata" JSONB,
    "lastActivitiesSync" TIMESTAMP(3),
    "lastHoldingsSync" TIMESTAMP(3),
    "name" TEXT,
    "provider" TEXT,
    "rawActivitiesPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawHoldingsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawPayload" JSONB,
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexa_capital_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kraken_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "lastNonce" BIGINT NOT NULL DEFAULT 0,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kraken_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kraken_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT NOT NULL,
    "accountType" TEXT,
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "institutionMetadata" JSONB,
    "krakenItemId" UUID NOT NULL,
    "name" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kraken_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunchflow_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lunchflow_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lunchflow_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "holdingsSupported" BOOLEAN NOT NULL DEFAULT true,
    "institutionMetadata" JSONB,
    "lunchflowItemId" UUID NOT NULL,
    "name" TEXT,
    "provider" TEXT,
    "rawHoldingsPayload" JSONB,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,

    CONSTRAINT "lunchflow_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mercury_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "token" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mercury_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mercury_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT NOT NULL,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "institutionMetadata" JSONB,
    "mercuryItemId" UUID NOT NULL,
    "name" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,

    CONSTRAINT "mercury_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monobank_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monobank_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monobank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountKind" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "creditLimit" DECIMAL(19,4),
    "currency" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "historySyncedFrom" TIMESTAMP(3),
    "iban" TEXT,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "institutionMetadata" JSONB,
    "maskedPan" TEXT,
    "monobankItemId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "statementSyncedThrough" TIMESTAMP(3),
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monobank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onchain_wallet_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etherscanApiKey" TEXT,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onchain_wallet_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onchain_wallet_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetKind" "onchain_asset_kind" NOT NULL,
    "chain" TEXT NOT NULL,
    "contentHash" TEXT,
    "contractAddress" TEXT,
    "currency" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "name" TEXT,
    "onchainWalletItemId" UUID NOT NULL,
    "quantity" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "rawMovementsPayload" JSONB,
    "rawPayload" JSONB,
    "symbol" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "onchain_wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaid_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accessToken" TEXT,
    "availableProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "billedProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionId" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "nextCursor" TEXT,
    "plaidId" TEXT NOT NULL,
    "plaidRegion" TEXT NOT NULL DEFAULT 'us',
    "rawInstitutionPayload" JSONB NOT NULL DEFAULT '{}',
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaid_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "availableBalance" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT '',
    "currentBalance" DECIMAL(19,4),
    "mask" TEXT,
    "name" TEXT NOT NULL,
    "plaidId" TEXT NOT NULL,
    "plaidItemId" UUID NOT NULL,
    "plaidSubtype" TEXT,
    "plaidType" TEXT NOT NULL,
    "rawHoldingsPayload" JSONB NOT NULL DEFAULT '{}',
    "rawLiabilitiesPayload" JSONB NOT NULL DEFAULT '{}',
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "rawTransactionsPayload" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaid_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questrade_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiServer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "refreshToken" TEXT,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questrade_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questrade_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountNumber" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "activitiesFetchPending" BOOLEAN NOT NULL DEFAULT false,
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "institutionMetadata" JSONB,
    "lastActivitiesSync" TIMESTAMP(3),
    "lastHoldingsSync" TIMESTAMP(3),
    "name" TEXT,
    "provider" TEXT,
    "questradeAccountId" TEXT,
    "questradeAuthorizationId" TEXT,
    "questradeItemId" UUID NOT NULL,
    "rawActivitiesPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawBalancesPayload" JSONB,
    "rawHoldingsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawPayload" JSONB,
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questrade_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redbark_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT NOT NULL,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redbark_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redbark_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountNumber" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "connectionId" TEXT,
    "currency" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "institutionMetadata" JSONB,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "redbarkAccountId" TEXT NOT NULL,
    "redbarkItemId" UUID NOT NULL,
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redbark_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simplefin_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accessUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simplefin_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simplefin_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountSubtype" TEXT,
    "accountType" TEXT,
    "availableBalance" DECIMAL(19,4),
    "balanceDate" TIMESTAMP(3),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "extra" JSONB,
    "name" TEXT,
    "orgData" JSONB,
    "rawHoldingsPayload" JSONB,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "simplefinItemId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simplefin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snaptrade_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clientId" TEXT,
    "consumerKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "name" TEXT,
    "oauthAccessToken" TEXT,
    "oauthRefreshToken" TEXT,
    "oauthScope" TEXT,
    "oauthTokenExpiresAt" TIMESTAMP(3),
    "oauthTokenType" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "snaptradeUserId" TEXT,
    "snaptradeUserSecret" TEXT,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snaptrade_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snaptrade_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountNumber" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "activitiesFetchPending" BOOLEAN NOT NULL DEFAULT false,
    "brokerageName" TEXT,
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "institutionMetadata" JSONB,
    "lastActivitiesSync" TIMESTAMP(3),
    "lastHoldingsSync" TIMESTAMP(3),
    "name" TEXT,
    "provider" TEXT,
    "rawActivitiesPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawBalancesPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawHoldingsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "snaptradeAccountId" TEXT,
    "snaptradeAuthorizationId" TEXT,
    "snaptradeItemId" UUID NOT NULL,
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snaptrade_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sophtron_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accessKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "currentJobId" TEXT,
    "currentJobSophtronAccountId" UUID,
    "customerId" TEXT,
    "customerName" TEXT,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "jobStatus" TEXT,
    "lastConnectionError" TEXT,
    "manualSync" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawCustomerPayload" JSONB,
    "rawInstitutionPayload" JSONB,
    "rawJobPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "userInstitutionId" TEXT,

    CONSTRAINT "sophtron_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sophtron_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT NOT NULL,
    "accountNumberMask" TEXT,
    "accountStatus" TEXT,
    "accountSubType" TEXT,
    "accountType" TEXT,
    "availableBalance" DECIMAL(19,4),
    "balance" DECIMAL(19,4),
    "currency" TEXT,
    "customerId" TEXT,
    "institutionMetadata" JSONB,
    "lastUpdated" TIMESTAMP(3),
    "manualSync" BOOLEAN NOT NULL DEFAULT false,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "sophtronItemId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sophtron_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_republic_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "familyId" UUID NOT NULL,
    "name" TEXT,
    "newestEventId" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "pendingLoginState" TEXT,
    "phoneNumber" TEXT,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "sessionBlob" TEXT,
    "status" TEXT NOT NULL DEFAULT 'good',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_republic_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_republic_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountType" TEXT,
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "holdingsSnapshotComplete" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL DEFAULT 'portfolio',
    "lastPositionsSync" TIMESTAMP(3),
    "name" TEXT,
    "rawPositionsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawTimelinePayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "tradeRepublicAccountId" TEXT,
    "tradeRepublicItemId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_republic_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading212_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "familyId" UUID NOT NULL,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstrumentsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading212_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading212_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountType" TEXT,
    "cashBalance" DECIMAL(19,4),
    "currency" TEXT,
    "currentBalance" DECIMAL(19,4),
    "lastOrdersSync" TIMESTAMP(3),
    "lastPositionsSync" TIMESTAMP(3),
    "name" TEXT,
    "rawDividendsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawOrdersPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawPositionsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "rawTransactionsPayload" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "trading212AccountId" TEXT,
    "trading212ItemId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading212_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "up_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "institutionColor" TEXT,
    "institutionDomain" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionUrl" TEXT,
    "name" TEXT,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "rawInstitutionPayload" JSONB,
    "rawPayload" JSONB,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" DATE,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "up_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "up_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" TEXT,
    "accountStatus" TEXT,
    "accountType" TEXT,
    "currency" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "institutionMetadata" JSONB,
    "name" TEXT NOT NULL,
    "ownershipType" TEXT,
    "provider" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "syncStartDate" DATE,
    "upItemId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "up_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wise_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyId" UUID NOT NULL,
    "importAllHistory" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "pendingAccountSetup" BOOLEAN NOT NULL DEFAULT false,
    "profileId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "rawPayload" JSONB,
    "scaPrivateKey" TEXT,
    "scheduledForDeletion" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'good',
    "syncStartDate" TIMESTAMP(3),
    "token" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wise_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wise_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "balanceId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "name" TEXT,
    "rawPayload" JSONB,
    "rawTransactionsPayload" JSONB,
    "reservedBalance" DECIMAL(19,4),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wiseItemId" UUID NOT NULL,

    CONSTRAINT "wise_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "index_families_on_bills_feed_token" ON "families"("billsFeedToken");

-- CreateIndex
CREATE INDEX "index_users_on_family_id" ON "users"("familyId");

-- CreateIndex
CREATE INDEX "index_users_on_last_viewed_chat_id" ON "users"("lastViewedChatId");

-- CreateIndex
CREATE INDEX "index_users_on_locale" ON "users"("locale");

-- CreateIndex
CREATE INDEX "index_users_on_preferences" ON "users" USING GIN ("preferences");

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_otp_secret" ON "users"("otpSecret");

-- CreateIndex
CREATE UNIQUE INDEX "index_users_on_webauthn_id" ON "users"("webauthnId");

-- CreateIndex
CREATE INDEX "index_invitations_on_family_id" ON "invitations"("familyId");

-- CreateIndex
CREATE INDEX "index_invitations_on_inviter_id" ON "invitations"("inviterId");

-- CreateIndex
CREATE INDEX "index_invitations_on_email" ON "invitations"("email");
CREATE UNIQUE INDEX "index_invitations_on_email_and_family_id_pending" ON "invitations"("email", "familyId") WHERE ("acceptedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "index_invitations_on_token" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "index_invitations_on_token_digest" ON "invitations"("tokenDigest");

-- CreateIndex
CREATE UNIQUE INDEX "index_invite_codes_on_token_digest" ON "invite_codes"("tokenDigest") WHERE ("tokenDigest" IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "index_invite_codes_on_token" ON "invite_codes"("token");

-- CreateIndex
CREATE INDEX "index_sessions_on_active_impersonator_session_id" ON "sessions"("activeImpersonatorSessionId");

-- CreateIndex
CREATE INDEX "index_sessions_on_ip_address_digest" ON "sessions"("ipAddressDigest");

-- CreateIndex
CREATE INDEX "index_sessions_on_user_id" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "index_mobile_devices_on_user_id" ON "mobile_devices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_mobile_devices_on_user_id_and_device_id" ON "mobile_devices"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "index_webauthn_credentials_on_user_id" ON "webauthn_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_webauthn_credentials_on_credential_id" ON "webauthn_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "index_api_keys_on_revoked_at" ON "api_keys"("revokedAt");

-- CreateIndex
CREATE INDEX "index_api_keys_on_user_id_and_source" ON "api_keys"("userId", "source");

-- CreateIndex
CREATE INDEX "index_api_keys_on_user_id" ON "api_keys"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_api_keys_on_display_key" ON "api_keys"("displayKey");

-- CreateIndex
CREATE INDEX "index_push_subscriptions_on_last_registered_at" ON "push_subscriptions"("lastRegisteredAt");

-- CreateIndex
CREATE INDEX "index_push_subscriptions_on_user_id" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "index_oidc_identities_on_issuer" ON "oidc_identities"("issuer");

-- CreateIndex
CREATE INDEX "index_oidc_identities_on_user_id" ON "oidc_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_oidc_identities_on_provider_and_uid" ON "oidc_identities"("provider", "uid");

-- CreateIndex
CREATE INDEX "index_impersonation_sessions_on_impersonated_id" ON "impersonation_sessions"("impersonatedId");

-- CreateIndex
CREATE INDEX "index_impersonation_sessions_on_impersonator_id" ON "impersonation_sessions"("impersonatorId");

-- CreateIndex
CREATE INDEX "index_impersonation_session_logs_on_impersonation_session_id" ON "impersonation_session_logs"("impersonationSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "index_settings_on_var" ON "settings"("var");

-- CreateIndex
CREATE UNIQUE INDEX "index_subscriptions_on_family_id" ON "subscriptions"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "index_account_providers_on_account_and_provider_type" ON "account_providers"("accountId", "providerType");

-- CreateIndex
CREATE UNIQUE INDEX "index_account_providers_on_provider_type_and_provider_id" ON "account_providers"("providerType", "providerId");

-- CreateIndex
CREATE INDEX "index_account_shares_on_account_id" ON "account_shares"("accountId");

-- CreateIndex
CREATE INDEX "index_account_shares_on_user_id_and_include_in_finances" ON "account_shares"("userId", "includeInFinances");

-- CreateIndex
CREATE INDEX "index_account_shares_on_user_id" ON "account_shares"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_account_shares_on_account_id_and_user_id" ON "account_shares"("accountId", "userId");

-- CreateIndex
CREATE INDEX "index_account_statements_on_account_period" ON "account_statements"("accountId", "periodStartOn", "periodEndOn");

-- CreateIndex
CREATE INDEX "index_account_statements_on_account_id" ON "account_statements"("accountId");

-- CreateIndex
CREATE INDEX "index_account_statements_on_family_checksum" ON "account_statements"("familyId", "checksum");

-- CreateIndex
CREATE INDEX "index_account_statements_on_family_review_status" ON "account_statements"("familyId", "reviewStatus");

-- CreateIndex
CREATE INDEX "index_account_statements_on_family_id" ON "account_statements"("familyId");

-- CreateIndex
CREATE INDEX "index_account_statements_on_suggested_account_review" ON "account_statements"("suggestedAccountId", "reviewStatus");

-- CreateIndex
CREATE INDEX "index_account_statements_on_suggested_account_id" ON "account_statements"("suggestedAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "index_account_statements_on_family_content_sha256" ON "account_statements"("familyId", "contentSha256");

-- CreateIndex
CREATE INDEX "index_accounts_on_accountable_id_and_accountable_type" ON "accounts"("accountableId", "accountableType");

-- CreateIndex
CREATE INDEX "index_accounts_on_accountable_type" ON "accounts"("accountableType");

-- CreateIndex
CREATE INDEX "index_accounts_on_currency" ON "accounts"("currency");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id_and_accountable_type" ON "accounts"("familyId", "accountableType");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id_and_exclude_from_reports" ON "accounts"("familyId", "excludeFromReports");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id_and_id" ON "accounts"("familyId", "id");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id_status_accountable_type" ON "accounts"("familyId", "status", "accountableType");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id_and_status" ON "accounts"("familyId", "status");

-- CreateIndex
CREATE INDEX "index_accounts_on_family_id" ON "accounts"("familyId");

-- CreateIndex
CREATE INDEX "index_accounts_on_import_id" ON "accounts"("importId");

-- CreateIndex
CREATE INDEX "index_accounts_on_owner_id" ON "accounts"("ownerId");

-- CreateIndex
CREATE INDEX "index_accounts_on_plaid_account_id" ON "accounts"("plaidAccountId");

-- CreateIndex
CREATE INDEX "index_accounts_on_simplefin_account_id" ON "accounts"("simplefinAccountId");

-- CreateIndex
CREATE INDEX "index_accounts_on_status" ON "accounts"("status");

-- CreateIndex
CREATE INDEX "index_addresses_on_addressable" ON "addresses"("addressableType", "addressableId");

-- CreateIndex
CREATE INDEX "index_balances_on_account_id_and_date" ON "balances"("accountId", "date" DESC);

-- CreateIndex
CREATE INDEX "index_balances_on_account_id" ON "balances"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "index_account_balances_on_account_id_date_currency_unique" ON "balances"("accountId", "date", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "index_exchange_rate_pairs_on_pair_unique" ON "exchange_rate_pairs"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "index_exchange_rates_on_from_currency" ON "exchange_rates"("fromCurrency");

-- CreateIndex
CREATE INDEX "index_exchange_rates_on_to_currency" ON "exchange_rates"("toCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "index_exchange_rates_on_base_converted_date_unique" ON "exchange_rates"("fromCurrency", "toCurrency", "date");

-- CreateIndex
CREATE INDEX "index_holdings_on_account_id" ON "holdings"("accountId");

-- CreateIndex
CREATE INDEX "index_holdings_on_account_provider_id" ON "holdings"("accountProviderId");

-- CreateIndex
CREATE INDEX "index_holdings_on_provider_security_id" ON "holdings"("providerSecurityId");

-- CreateIndex
CREATE INDEX "index_holdings_on_security_id" ON "holdings"("securityId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_holdings_on_account_id_external_id_unique" ON "holdings"("accountId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_account_id_security_id_date_currency_5323e39f8b" ON "holdings"("accountId", "securityId", "date", "currency");

-- CreateIndex
CREATE INDEX "index_properties_on_avm_provider_sync" ON "properties"("avmLastSyncedOn" NULLS FIRST) WHERE ("avmProvider" IS NOT NULL);

-- CreateIndex
CREATE INDEX "index_securities_on_country_code" ON "securities"("countryCode");

-- CreateIndex
CREATE INDEX "index_securities_on_exchange_operating_mic" ON "securities"("exchangeOperatingMic");

-- CreateIndex
CREATE INDEX "index_securities_on_kind" ON "securities"("kind");

-- CreateIndex
CREATE INDEX "index_securities_on_price_provider_and_offline_reason" ON "securities"("priceProvider", "offlineReason");

-- CreateIndex
CREATE INDEX "index_securities_on_price_provider" ON "securities"("priceProvider");

-- CreateIndex
CREATE INDEX "index_security_prices_on_security_id" ON "security_prices"("securityId");

-- CreateIndex
CREATE UNIQUE INDEX "index_security_prices_on_security_id_and_date_and_currency" ON "security_prices"("securityId", "date", "currency");

-- CreateIndex
CREATE INDEX "index_trades_on_extra" ON "trades" USING GIN ("extra");

-- CreateIndex
CREATE INDEX "index_trades_on_investment_activity_label" ON "trades"("investmentActivityLabel");

-- CreateIndex
CREATE INDEX "index_trades_on_security_id" ON "trades"("securityId");

-- CreateIndex
CREATE INDEX "index_entries_on_investment_totals_lookup" ON "entries"("accountId", "date", "entryableId") WHERE ((("entryableType")::text = 'Trade'::text) AND (excluded = false));

-- CreateIndex
CREATE INDEX "index_entries_on_account_id_and_date" ON "entries"("accountId", "date");

-- CreateIndex
CREATE INDEX "index_entries_on_account_and_reconciled_at" ON "entries"("accountId", "reconciledAt") WHERE ("reconciledAt" IS NOT NULL);

-- CreateIndex
CREATE INDEX "index_entries_on_account_id" ON "entries"("accountId");

-- CreateIndex
CREATE INDEX "index_entries_on_transfer_match_lookup" ON "entries"("currency", "amount", "date", "accountId") WHERE ((("entryableType")::text = 'Transaction'::text) AND (excluded = false));

-- CreateIndex
CREATE INDEX "index_entries_on_date" ON "entries"("date");

-- CreateIndex
CREATE INDEX "index_entries_on_entryable_type" ON "entries"("entryableType");

-- CreateIndex
CREATE INDEX "index_entries_on_import_id" ON "entries"("importId");

-- CreateIndex
CREATE INDEX "index_entries_on_import_locked_true" ON "entries"("importLocked") WHERE ("importLocked" = true);

-- CreateIndex
CREATE INDEX "index_entries_on_parent_entry_id" ON "entries"("parentEntryId");

-- CreateIndex
CREATE INDEX "index_entries_on_reconciled_by_statement" ON "entries"("reconciledByStatementId") WHERE ("reconciledByStatementId" IS NOT NULL);

-- CreateIndex
CREATE INDEX "index_entries_on_user_modified_true" ON "entries"("userModified") WHERE ("userModified" = true);

-- CreateIndex
CREATE UNIQUE INDEX "index_entries_on_account_and_idempotency_key" ON "entries"("accountId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "index_entries_on_account_source_and_external_id" ON "entries"("accountId", "source", "externalId");

-- CreateIndex
CREATE INDEX "index_transactions_on_category_id" ON "transactions"("categoryId");

-- CreateIndex
CREATE INDEX "index_transactions_on_external_id" ON "transactions"("externalId");

-- CreateIndex
CREATE INDEX "index_transactions_on_extra" ON "transactions" USING GIN ("extra");

-- CreateIndex
CREATE INDEX "index_transactions_on_investment_activity_label" ON "transactions"("investmentActivityLabel");

-- CreateIndex
CREATE INDEX "index_transactions_on_kind" ON "transactions"("kind");

-- CreateIndex
CREATE INDEX "index_transactions_on_merchant_id" ON "transactions"("merchantId");

-- CreateIndex
CREATE INDEX "index_transactions_on_transfer_id" ON "transactions"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_transactions_extra_goal_pledge_id" ON "transactions"(((extra -> 'goal') ->> 'pledge_id'::text)) WHERE (((extra -> 'goal') ->> 'pledge_id'::text) IS NOT NULL);

-- CreateIndex
CREATE INDEX "index_transfers_on_inflow_transaction_id" ON "transfers"("inflowTransactionId");

-- CreateIndex
CREATE INDEX "index_transfers_on_outflow_transaction_id" ON "transfers"("outflowTransactionId");

-- CreateIndex
CREATE INDEX "index_transfers_on_status" ON "transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_inflow_transaction_id_outflow_transaction_id_8cd07a28bd" ON "transfers"("inflowTransactionId", "outflowTransactionId");

-- CreateIndex
CREATE INDEX "index_rejected_transfers_on_inflow_transaction_id" ON "rejected_transfers"("inflowTransactionId");

-- CreateIndex
CREATE INDEX "index_rejected_transfers_on_outflow_transaction_id" ON "rejected_transfers"("outflowTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_inflow_transaction_id_outflow_transaction_id_412f8e7e26" ON "rejected_transfers"("inflowTransactionId", "outflowTransactionId");

-- CreateIndex
CREATE INDEX "index_categories_on_family_id_and_last_used_at" ON "categories"("familyId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "index_categories_on_family_id" ON "categories"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "index_categories_on_family_id_and_name" ON "categories"("familyId", "name");

-- CreateIndex
CREATE INDEX "index_merchants_on_family_id" ON "merchants"("familyId");

-- CreateIndex
CREATE INDEX "index_merchants_on_type" ON "merchants"("type");
CREATE UNIQUE INDEX "index_merchants_on_family_id_and_name" ON "merchants"("familyId", "name") WHERE ((type)::text = 'FamilyMerchant'::text);
CREATE UNIQUE INDEX "index_merchants_on_provider_merchant_id_and_source" ON "merchants"("providerMerchantId", "source") WHERE (("providerMerchantId" IS NOT NULL) AND ((type)::text = 'ProviderMerchant'::text));
CREATE UNIQUE INDEX "index_merchants_on_source_and_name" ON "merchants"("source", "name") WHERE ((type)::text = 'ProviderMerchant'::text);

-- CreateIndex
CREATE INDEX "index_family_merchant_associations_on_family_id" ON "family_merchant_associations"("familyId");

-- CreateIndex
CREATE INDEX "index_family_merchant_associations_on_merchant_id" ON "family_merchant_associations"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_family_id_merchant_id_23e883e08f" ON "family_merchant_associations"("familyId", "merchantId");

-- CreateIndex
CREATE INDEX "index_tags_on_family_id" ON "tags"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "index_tags_on_family_id_and_name" ON "tags"("familyId", "name");

-- CreateIndex
CREATE INDEX "index_taggings_on_tag_id" ON "taggings"("tagId");

-- CreateIndex
CREATE INDEX "index_taggings_on_taggable" ON "taggings"("taggableType", "taggableId");

-- CreateIndex
CREATE INDEX "index_rules_on_family_id" ON "rules"("familyId");

-- CreateIndex
CREATE INDEX "index_rule_conditions_on_parent_id" ON "rule_conditions"("parentId");

-- CreateIndex
CREATE INDEX "index_rule_conditions_on_rule_id" ON "rule_conditions"("ruleId");

-- CreateIndex
CREATE INDEX "index_rule_actions_on_rule_id" ON "rule_actions"("ruleId");

-- CreateIndex
CREATE INDEX "index_rule_runs_on_executed_at" ON "rule_runs"("executedAt");

-- CreateIndex
CREATE INDEX "index_rule_runs_on_rule_id_and_executed_at" ON "rule_runs"("ruleId", "executedAt");

-- CreateIndex
CREATE INDEX "index_rule_runs_on_rule_id" ON "rule_runs"("ruleId");

-- CreateIndex
CREATE INDEX "index_notification_deliveries_on_rule_id" ON "notification_deliveries"("ruleId");

-- CreateIndex
CREATE INDEX "index_notification_deliveries_on_transaction_id" ON "notification_deliveries"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "index_notification_deliveries_on_rule_and_transaction" ON "notification_deliveries"("ruleId", "transactionId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_account_id" ON "recurring_transactions"("accountId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_category_id" ON "recurring_transactions"("categoryId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_destination_account_id" ON "recurring_transactions"("destinationAccountId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_family_id_and_status" ON "recurring_transactions"("familyId", "status");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_family_id" ON "recurring_transactions"("familyId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_merchant_id" ON "recurring_transactions"("merchantId");

-- CreateIndex
CREATE INDEX "index_recurring_transactions_on_next_expected_date" ON "recurring_transactions"("nextExpectedDate");
CREATE UNIQUE INDEX "idx_recurring_txns_pair_merchant" ON "recurring_transactions"("familyId", "accountId", "destinationAccountId", "merchantId", "amount", "currency", "dedupScope") WHERE (("destinationAccountId" IS NOT NULL) AND ("merchantId" IS NOT NULL));
CREATE UNIQUE INDEX "idx_recurring_txns_pair_name" ON "recurring_transactions"("familyId", "accountId", "destinationAccountId", "name", "amount", "currency", "dedupScope") WHERE (("destinationAccountId" IS NOT NULL) AND ("name" IS NOT NULL) AND ("merchantId" IS NULL));
CREATE UNIQUE INDEX "idx_recurring_txns_acct_merchant" ON "recurring_transactions"("familyId", "accountId", "merchantId", "amount", "currency", "dedupScope") WHERE (("merchantId" IS NOT NULL) AND ("destinationAccountId" IS NULL));
CREATE UNIQUE INDEX "idx_recurring_txns_acct_name" ON "recurring_transactions"("familyId", "accountId", "name", "amount", "currency", "dedupScope") WHERE (("name" IS NOT NULL) AND ("merchantId" IS NULL) AND ("destinationAccountId" IS NULL));

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_recurring_transaction_id_position_62f0900d95" ON "recurrence_rules"("recurringTransactionId", "position");

-- CreateIndex
CREATE INDEX "index_recurring_occurrences_on_family_id_and_due_on" ON "recurring_occurrences"("familyId", "dueOn");

-- CreateIndex
CREATE INDEX "index_recurring_occurrences_on_family_id_and_status_and_due_on" ON "recurring_occurrences"("familyId", "status", "dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "idx_recurring_occurrences_identity" ON "recurring_occurrences"("recurringTransactionId", "originalDueOn");

-- CreateIndex
CREATE INDEX "index_recurring_allocations_on_entry_id" ON "recurring_allocations"("entryId");

-- CreateIndex
CREATE INDEX "index_recurring_allocations_on_recurring_occurrence_id" ON "recurring_allocations"("recurringOccurrenceId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_recurring_allocations_entry_once" ON "recurring_allocations"("recurringOccurrenceId", "entryId");

-- CreateIndex
CREATE INDEX "index_recurring_match_rejections_on_entry_id" ON "recurring_match_rejections"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_recurring_match_rejections_pair" ON "recurring_match_rejections"("recurringTransactionId", "entryId");

-- CreateIndex
CREATE INDEX "index_recurring_price_changes_on_entry_id" ON "recurring_price_changes"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_recurring_price_changes_identity" ON "recurring_price_changes"("recurringTransactionId", "effectiveOn");

-- CreateIndex
CREATE INDEX "index_budgets_on_family_id" ON "budgets"("familyId");

-- CreateIndex
CREATE INDEX "index_budgets_on_user_id" ON "budgets"("userId");
CREATE UNIQUE INDEX "index_budgets_personal_unique" ON "budgets"("familyId", "startDate", "endDate", "userId") WHERE ("userId" IS NOT NULL);
CREATE UNIQUE INDEX "index_budgets_shared_unique" ON "budgets"("familyId", "startDate", "endDate") WHERE ("userId" IS NULL);

-- CreateIndex
CREATE INDEX "index_budget_categories_on_budget_id" ON "budget_categories"("budgetId");

-- CreateIndex
CREATE INDEX "index_budget_categories_on_category_id" ON "budget_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "index_budget_categories_on_budget_id_and_category_id" ON "budget_categories"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "index_budget_shares_on_owner_id" ON "budget_shares"("ownerId");

-- CreateIndex
CREATE INDEX "index_budget_shares_on_viewer_id" ON "budget_shares"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "index_budget_shares_on_owner_id_and_viewer_id" ON "budget_shares"("ownerId", "viewerId");

-- CreateIndex
CREATE INDEX "index_goals_on_family_id_and_state" ON "goals"("familyId", "state");

-- CreateIndex
CREATE INDEX "index_goals_on_family_id" ON "goals"("familyId");

-- CreateIndex
CREATE INDEX "index_goal_accounts_on_account_id" ON "goal_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_goal_accounts_on_goal_id" ON "goal_accounts"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "index_savings_goal_accounts_on_goal_and_account" ON "goal_accounts"("goalId", "accountId");

-- CreateIndex
CREATE INDEX "index_goal_pledges_on_account_id" ON "goal_pledges"("accountId");

-- CreateIndex
CREATE INDEX "index_goal_pledges_on_goal_id_and_status" ON "goal_pledges"("goalId", "status");

-- CreateIndex
CREATE INDEX "index_goal_pledges_on_goal_id" ON "goal_pledges"("goalId");

-- CreateIndex
CREATE INDEX "index_goal_pledges_open_by_expiry" ON "goal_pledges"("status", "expiresAt") WHERE (status = 'open');

-- CreateIndex
CREATE UNIQUE INDEX "index_goal_pledges_on_matched_transaction_id" ON "goal_pledges"("matchedTransactionId") WHERE ("matchedTransactionId" IS NOT NULL);

-- CreateIndex
CREATE INDEX "index_imports_on_account_statement_id" ON "imports"("accountStatementId");

-- CreateIndex
CREATE INDEX "index_imports_on_family_id" ON "imports"("familyId");

-- CreateIndex
CREATE INDEX "index_imports_on_import_session_id" ON "imports"("importSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_imports_on_session_client_chunk" ON "imports"("importSessionId", "clientChunkId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_imports_on_session_sequence" ON "imports"("importSessionId", "sequence");

-- CreateIndex
CREATE INDEX "index_import_rows_on_import_id" ON "import_rows"("importId");

-- CreateIndex
CREATE UNIQUE INDEX "index_import_rows_on_import_id_and_source_row_number" ON "import_rows"("importId", "sourceRowNumber");

-- CreateIndex
CREATE INDEX "index_import_mappings_on_import_id" ON "import_mappings"("importId");

-- CreateIndex
CREATE INDEX "index_import_mappings_on_mappable" ON "import_mappings"("mappableType", "mappableId");

-- CreateIndex
CREATE INDEX "index_import_sessions_on_family_id_and_status" ON "import_sessions"("familyId", "status");

-- CreateIndex
CREATE INDEX "index_import_sessions_on_family_id" ON "import_sessions"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_import_sessions_on_family_client_session" ON "import_sessions"("familyId", "clientSessionId");

-- CreateIndex
CREATE INDEX "idx_import_source_mappings_on_family_source" ON "import_source_mappings"("familyId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "index_import_source_mappings_on_family_id" ON "import_source_mappings"("familyId");

-- CreateIndex
CREATE INDEX "index_import_source_mappings_on_import_session_id" ON "import_source_mappings"("importSessionId");

-- CreateIndex
CREATE INDEX "idx_import_source_mappings_on_target" ON "import_source_mappings"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "index_import_source_mappings_on_session_type_and_source" ON "import_source_mappings"("importSessionId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "index_family_exports_on_family_id" ON "family_exports"("familyId");

-- CreateIndex
CREATE INDEX "index_archived_exports_on_expires_at" ON "archived_exports"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "index_archived_exports_on_download_token_digest" ON "archived_exports"("downloadTokenDigest");

-- CreateIndex
CREATE INDEX "index_family_documents_on_family_id" ON "family_documents"("familyId");

-- CreateIndex
CREATE INDEX "index_family_documents_on_provider_file_id" ON "family_documents"("providerFileId");

-- CreateIndex
CREATE INDEX "index_family_documents_on_status" ON "family_documents"("status");

-- CreateIndex
CREATE INDEX "index_syncs_on_parent_id" ON "syncs"("parentId");

-- CreateIndex
CREATE INDEX "index_syncs_on_status" ON "syncs"("status");

-- CreateIndex
CREATE INDEX "index_syncs_on_syncable_and_created_at_and_id" ON "syncs"("syncableType", "syncableId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "index_syncs_on_syncable" ON "syncs"("syncableType", "syncableId");

-- CreateIndex
CREATE INDEX "index_chats_on_user_id" ON "chats"("userId");

-- CreateIndex
CREATE INDEX "index_messages_on_chat_id" ON "messages"("chatId");

-- CreateIndex
CREATE INDEX "index_tool_calls_on_message_id" ON "tool_calls"("messageId");

-- CreateIndex
CREATE INDEX "index_llm_usages_on_family_id_and_created_at" ON "llm_usages"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "index_llm_usages_on_family_id_and_operation" ON "llm_usages"("familyId", "operation");

-- CreateIndex
CREATE INDEX "index_llm_usages_on_family_id" ON "llm_usages"("familyId");

-- CreateIndex
CREATE INDEX "index_insights_on_family_id_and_generated_at" ON "insights"("familyId", "generatedAt");

-- CreateIndex
CREATE INDEX "index_insights_on_family_id_and_status" ON "insights"("familyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "index_insights_on_family_id_and_dedup_key" ON "insights"("familyId", "dedupKey");

-- CreateIndex
CREATE INDEX "index_data_enrichments_on_enrichable" ON "data_enrichments"("enrichableType", "enrichableId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_enrichable_id_enrichable_type_source_attribu_5be5f63e08" ON "data_enrichments"("enrichableId", "enrichableType", "source", "attributeName");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_account_id" ON "debug_log_entries"("accountId");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_account_provider_id" ON "debug_log_entries"("accountProviderId");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_category_and_created_at" ON "debug_log_entries"("category", "createdAt");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_category" ON "debug_log_entries"("category");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_created_at" ON "debug_log_entries"("createdAt");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_family_id" ON "debug_log_entries"("familyId");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_level" ON "debug_log_entries"("level");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_provider_key_and_created_at" ON "debug_log_entries"("providerKey", "createdAt");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_provider_key" ON "debug_log_entries"("providerKey");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_source" ON "debug_log_entries"("source");

-- CreateIndex
CREATE INDEX "index_debug_log_entries_on_user_id" ON "debug_log_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_provider_request_counts_on_provider_key_and_period" ON "provider_request_counts"("providerKey", "period");

-- CreateIndex
CREATE INDEX "index_eval_datasets_on_eval_type_and_active" ON "eval_datasets"("evalType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "index_eval_datasets_on_name" ON "eval_datasets"("name");

-- CreateIndex
CREATE INDEX "index_eval_runs_on_eval_dataset_id_and_model" ON "eval_runs"("evalDatasetId", "model");

-- CreateIndex
CREATE INDEX "index_eval_runs_on_eval_dataset_id" ON "eval_runs"("evalDatasetId");

-- CreateIndex
CREATE INDEX "index_eval_runs_on_provider_and_model" ON "eval_runs"("provider", "model");

-- CreateIndex
CREATE INDEX "index_eval_runs_on_status" ON "eval_runs"("status");

-- CreateIndex
CREATE INDEX "index_eval_samples_on_eval_dataset_id_and_difficulty" ON "eval_samples"("evalDatasetId", "difficulty");

-- CreateIndex
CREATE INDEX "index_eval_samples_on_eval_dataset_id" ON "eval_samples"("evalDatasetId");

-- CreateIndex
CREATE INDEX "index_eval_samples_on_tags" ON "eval_samples" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "index_eval_results_on_eval_run_id_and_correct" ON "eval_results"("evalRunId", "correct");

-- CreateIndex
CREATE INDEX "index_eval_results_on_eval_run_id" ON "eval_results"("evalRunId");

-- CreateIndex
CREATE INDEX "index_eval_results_on_eval_sample_id" ON "eval_results"("evalSampleId");

-- CreateIndex
CREATE INDEX "index_sso_providers_on_enabled" ON "sso_providers"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "index_sso_providers_on_name" ON "sso_providers"("name");

-- CreateIndex
CREATE INDEX "index_sso_audit_logs_on_created_at" ON "sso_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "index_sso_audit_logs_on_event_type" ON "sso_audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "index_sso_audit_logs_on_user_id_and_created_at" ON "sso_audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "index_sso_audit_logs_on_user_id" ON "sso_audit_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "index_sso_identity_blocks_on_provider_and_uid_digest" ON "sso_identity_blocks"("provider", "uidDigest");

-- CreateIndex

-- CreateIndex

-- CreateIndex

-- CreateIndex

-- CreateIndex
CREATE INDEX "index_vector_store_chunks_on_store_id" ON "vector_store_chunks"("storeId");

-- CreateIndex
CREATE INDEX "index_vector_store_chunks_on_file_id" ON "vector_store_chunks"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "index_vector_store_chunks_on_store_file_chunk" ON "vector_store_chunks"("storeId", "fileId", "chunkIndex");

-- CreateIndex
CREATE INDEX "index_akahu_items_on_family_id" ON "akahu_items"("familyId");

-- CreateIndex
CREATE INDEX "index_akahu_items_on_status" ON "akahu_items"("status");

-- CreateIndex
CREATE INDEX "index_akahu_accounts_on_account_id" ON "akahu_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_akahu_accounts_on_akahu_item_id" ON "akahu_accounts"("akahuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_akahu_accounts_on_item_and_account_id" ON "akahu_accounts"("akahuItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_binance_items_on_family_id" ON "binance_items"("familyId");

-- CreateIndex
CREATE INDEX "index_binance_items_on_status" ON "binance_items"("status");

-- CreateIndex
CREATE INDEX "index_binance_accounts_on_account_type" ON "binance_accounts"("accountType");

-- CreateIndex
CREATE INDEX "index_binance_accounts_on_binance_item_id" ON "binance_accounts"("binanceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_binance_accounts_on_item_and_type" ON "binance_accounts"("binanceItemId", "accountType");

-- CreateIndex
CREATE INDEX "index_brex_items_on_family_id" ON "brex_items"("familyId");

-- CreateIndex
CREATE INDEX "index_brex_items_on_status" ON "brex_items"("status");

-- CreateIndex
CREATE INDEX "index_brex_accounts_on_brex_item_id" ON "brex_accounts"("brexItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_brex_accounts_on_item_and_account_id" ON "brex_accounts"("brexItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_coinbase_items_on_family_id" ON "coinbase_items"("familyId");

-- CreateIndex
CREATE INDEX "index_coinbase_items_on_status" ON "coinbase_items"("status");

-- CreateIndex
CREATE INDEX "index_coinbase_accounts_on_account_id" ON "coinbase_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_coinbase_accounts_on_coinbase_item_id" ON "coinbase_accounts"("coinbaseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_coinbase_accounts_on_item_and_account_id" ON "coinbase_accounts"("coinbaseItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_coinstats_items_on_exchange_connection_id" ON "coinstats_items"("exchangeConnectionId");

-- CreateIndex
CREATE INDEX "index_coinstats_items_on_family_id" ON "coinstats_items"("familyId");

-- CreateIndex
CREATE INDEX "index_coinstats_items_on_status" ON "coinstats_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "index_coinstats_items_on_family_id_and_exchange_portfolio_id" ON "coinstats_items"("familyId", "exchangePortfolioId");

-- CreateIndex
CREATE INDEX "index_coinstats_accounts_on_coinstats_item_id" ON "coinstats_accounts"("coinstatsItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_coinstats_accounts_on_item_account_and_wallet" ON "coinstats_accounts"("coinstatsItemId", "accountId", "walletAddress");

-- CreateIndex
CREATE INDEX "index_enable_banking_items_on_family_id" ON "enable_banking_items"("familyId");

-- CreateIndex
CREATE INDEX "index_enable_banking_items_on_status" ON "enable_banking_items"("status");

-- CreateIndex
CREATE INDEX "index_enable_banking_accounts_on_account_id" ON "enable_banking_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_enable_banking_accounts_on_enable_banking_item_id" ON "enable_banking_accounts"("enableBankingItemId");

-- CreateIndex
CREATE INDEX "index_enable_banking_accounts_on_identification_hashes" ON "enable_banking_accounts" USING GIN ("identificationHashes");

-- CreateIndex
CREATE INDEX "index_ibkr_items_on_family_id" ON "ibkr_items"("familyId");

-- CreateIndex
CREATE INDEX "index_ibkr_items_on_status" ON "ibkr_items"("status");

-- CreateIndex
CREATE INDEX "index_ibkr_accounts_on_ibkr_item_id" ON "ibkr_accounts"("ibkrItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_ibkr_accounts_on_item_and_ibkr_account_id" ON "ibkr_accounts"("ibkrItemId", "ibkrAccountId");

-- CreateIndex
CREATE INDEX "index_indexa_capital_items_on_family_id" ON "indexa_capital_items"("familyId");

-- CreateIndex
CREATE INDEX "index_indexa_capital_items_on_status" ON "indexa_capital_items"("status");

-- CreateIndex
CREATE INDEX "idx_on_indexa_capital_authorization_id_58db208d52" ON "indexa_capital_accounts"("indexaCapitalAuthorizationId");

-- CreateIndex
CREATE INDEX "index_indexa_capital_accounts_on_indexa_capital_item_id" ON "indexa_capital_accounts"("indexaCapitalItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_indexa_capital_accounts_on_item_and_account_id" ON "indexa_capital_accounts"("indexaCapitalItemId", "indexaCapitalAccountId");

-- CreateIndex
CREATE INDEX "index_kraken_items_on_family_id" ON "kraken_items"("familyId");

-- CreateIndex
CREATE INDEX "index_kraken_items_on_status" ON "kraken_items"("status");

-- CreateIndex
CREATE INDEX "index_kraken_accounts_on_account_type" ON "kraken_accounts"("accountType");

-- CreateIndex
CREATE INDEX "index_kraken_accounts_on_kraken_item_id" ON "kraken_accounts"("krakenItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_kraken_accounts_on_item_and_account_id" ON "kraken_accounts"("krakenItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_lunchflow_items_on_family_id" ON "lunchflow_items"("familyId");

-- CreateIndex
CREATE INDEX "index_lunchflow_items_on_status" ON "lunchflow_items"("status");

-- CreateIndex
CREATE INDEX "index_lunchflow_accounts_on_account_id" ON "lunchflow_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_lunchflow_accounts_on_lunchflow_item_id" ON "lunchflow_accounts"("lunchflowItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_lunchflow_accounts_on_item_and_account_id" ON "lunchflow_accounts"("lunchflowItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_mercury_items_on_family_id" ON "mercury_items"("familyId");

-- CreateIndex
CREATE INDEX "index_mercury_items_on_status" ON "mercury_items"("status");

-- CreateIndex
CREATE INDEX "index_mercury_accounts_on_mercury_item_id" ON "mercury_accounts"("mercuryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_mercury_accounts_on_item_and_account_id" ON "mercury_accounts"("mercuryItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_monobank_items_on_family_id" ON "monobank_items"("familyId");

-- CreateIndex
CREATE INDEX "index_monobank_items_on_status" ON "monobank_items"("status");

-- CreateIndex
CREATE INDEX "index_monobank_accounts_on_account_id" ON "monobank_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_monobank_accounts_on_monobank_item_id" ON "monobank_accounts"("monobankItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_monobank_accounts_on_item_and_account_id" ON "monobank_accounts"("monobankItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_onchain_wallet_items_on_family_id" ON "onchain_wallet_items"("familyId");

-- CreateIndex
CREATE INDEX "index_onchain_wallet_items_on_status" ON "onchain_wallet_items"("status");

-- CreateIndex
CREATE INDEX "index_onchain_wallet_accounts_on_item_and_address" ON "onchain_wallet_accounts"("onchainWalletItemId", "chain", "walletAddress");
CREATE UNIQUE INDEX "index_onchain_wallet_accounts_unique_erc20" ON "onchain_wallet_accounts"("onchainWalletItemId", "contractAddress", "chain") WHERE "assetKind" = 'erc20';
CREATE UNIQUE INDEX "index_onchain_wallet_accounts_unique_spl" ON "onchain_wallet_accounts"("onchainWalletItemId", "contractAddress", "chain") WHERE "assetKind" = 'spl';
CREATE UNIQUE INDEX "index_onchain_wallet_accounts_unique_native" ON "onchain_wallet_accounts"("onchainWalletItemId", "chain") WHERE "assetKind" = 'native';

-- CreateIndex
CREATE INDEX "index_onchain_wallet_accounts_on_onchain_wallet_item_id" ON "onchain_wallet_accounts"("onchainWalletItemId");

-- CreateIndex
CREATE INDEX "index_plaid_items_on_family_id" ON "plaid_items"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "index_plaid_items_on_plaid_id" ON "plaid_items"("plaidId");

-- CreateIndex
CREATE INDEX "index_plaid_accounts_on_plaid_item_id" ON "plaid_accounts"("plaidItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_plaid_accounts_on_item_and_plaid_id" ON "plaid_accounts"("plaidItemId", "plaidId");

-- CreateIndex
CREATE INDEX "index_questrade_items_on_family_id" ON "questrade_items"("familyId");

-- CreateIndex
CREATE INDEX "index_questrade_items_on_status" ON "questrade_items"("status");

-- CreateIndex
CREATE INDEX "index_questrade_accounts_on_questrade_authorization_id" ON "questrade_accounts"("questradeAuthorizationId");

-- CreateIndex
CREATE INDEX "index_questrade_accounts_on_questrade_item_id" ON "questrade_accounts"("questradeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_questrade_item_id_questrade_account_id_c3e6274342" ON "questrade_accounts"("questradeItemId", "questradeAccountId");

-- CreateIndex
CREATE INDEX "index_redbark_items_on_family_id" ON "redbark_items"("familyId");

-- CreateIndex
CREATE INDEX "index_redbark_items_on_status" ON "redbark_items"("status");

-- CreateIndex
CREATE INDEX "index_redbark_accounts_on_redbark_item_id" ON "redbark_accounts"("redbarkItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_redbark_accounts_on_item_and_account_id" ON "redbark_accounts"("redbarkItemId", "redbarkAccountId");

-- CreateIndex
CREATE INDEX "index_simplefin_items_on_family_id" ON "simplefin_items"("familyId");

-- CreateIndex
CREATE INDEX "index_simplefin_items_on_institution_domain" ON "simplefin_items"("institutionDomain");

-- CreateIndex
CREATE INDEX "index_simplefin_items_on_institution_id" ON "simplefin_items"("institutionId");

-- CreateIndex
CREATE INDEX "index_simplefin_items_on_institution_name" ON "simplefin_items"("institutionName");

-- CreateIndex
CREATE INDEX "index_simplefin_items_on_status" ON "simplefin_items"("status");

-- CreateIndex
CREATE INDEX "index_simplefin_accounts_on_account_id" ON "simplefin_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_simplefin_accounts_on_simplefin_item_id" ON "simplefin_accounts"("simplefinItemId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_sfa_per_item_and_upstream" ON "simplefin_accounts"("simplefinItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_snaptrade_items_on_family_id" ON "snaptrade_items"("familyId");

-- CreateIndex
CREATE INDEX "index_snaptrade_items_on_status" ON "snaptrade_items"("status");

-- CreateIndex
CREATE INDEX "index_snaptrade_accounts_on_snaptrade_item_id" ON "snaptrade_accounts"("snaptradeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_snaptrade_accounts_on_item_and_snaptrade_account_id" ON "snaptrade_accounts"("snaptradeItemId", "snaptradeAccountId");

-- CreateIndex
CREATE INDEX "index_sophtron_items_on_current_job_sophtron_account_id" ON "sophtron_items"("currentJobSophtronAccountId");

-- CreateIndex
CREATE INDEX "index_sophtron_items_on_customer_id" ON "sophtron_items"("customerId");

-- CreateIndex
CREATE INDEX "index_sophtron_items_on_family_id" ON "sophtron_items"("familyId");

-- CreateIndex
CREATE INDEX "index_sophtron_items_on_status" ON "sophtron_items"("status");

-- CreateIndex
CREATE INDEX "index_sophtron_items_on_user_institution_id" ON "sophtron_items"("userInstitutionId");

-- CreateIndex
CREATE INDEX "index_sophtron_accounts_on_account_id" ON "sophtron_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_sophtron_accounts_on_sophtron_item_id" ON "sophtron_accounts"("sophtronItemId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_sophtron_accounts_per_item" ON "sophtron_accounts"("sophtronItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_trade_republic_items_on_family_id" ON "trade_republic_items"("familyId");

-- CreateIndex
CREATE INDEX "index_trade_republic_items_on_status" ON "trade_republic_items"("status");

-- CreateIndex
CREATE INDEX "index_trade_republic_accounts_on_trade_republic_item_id" ON "trade_republic_accounts"("tradeRepublicItemId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_on_trade_republic_item_id_kind_3b60cc72fb" ON "trade_republic_accounts"("tradeRepublicItemId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "index_trade_republic_accounts_on_item_and_account_id" ON "trade_republic_accounts"("tradeRepublicItemId", "tradeRepublicAccountId");

-- CreateIndex
CREATE INDEX "index_trading212_items_on_family_id" ON "trading212_items"("familyId");

-- CreateIndex
CREATE INDEX "index_trading212_items_on_status" ON "trading212_items"("status");

-- CreateIndex
CREATE INDEX "index_trading212_accounts_on_trading212_item_id" ON "trading212_accounts"("trading212ItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_trading212_accounts_on_item_and_account_id" ON "trading212_accounts"("trading212ItemId", "trading212AccountId");

-- CreateIndex
CREATE INDEX "index_up_items_on_family_id" ON "up_items"("familyId");

-- CreateIndex
CREATE INDEX "index_up_items_on_status" ON "up_items"("status");

-- CreateIndex
CREATE INDEX "index_up_accounts_on_account_id" ON "up_accounts"("accountId");

-- CreateIndex
CREATE INDEX "index_up_accounts_on_up_item_id" ON "up_accounts"("upItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_up_accounts_on_item_and_account_id" ON "up_accounts"("upItemId", "accountId");

-- CreateIndex
CREATE INDEX "index_wise_items_on_family_id" ON "wise_items"("familyId");

-- CreateIndex
CREATE INDEX "index_wise_items_on_status" ON "wise_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "index_wise_items_on_family_id_and_profile_id" ON "wise_items"("familyId", "profileId");

-- CreateIndex
CREATE INDEX "index_wise_accounts_on_wise_item_id" ON "wise_accounts"("wiseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "index_wise_accounts_on_wise_item_id_and_balance_id" ON "wise_accounts"("wiseItemId", "balanceId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultAccountId_fkey" FOREIGN KEY ("defaultAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lastViewedChatId_fkey" FOREIGN KEY ("lastViewedChatId") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_activeImpersonatorSessionId_fkey" FOREIGN KEY ("activeImpersonatorSessionId") REFERENCES "impersonation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_devices" ADD CONSTRAINT "mobile_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_identities" ADD CONSTRAINT "oidc_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_impersonatedId_fkey" FOREIGN KEY ("impersonatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_impersonatorId_fkey" FOREIGN KEY ("impersonatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_session_logs" ADD CONSTRAINT "impersonation_session_logs_impersonationSessionId_fkey" FOREIGN KEY ("impersonationSessionId") REFERENCES "impersonation_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_providers" ADD CONSTRAINT "account_providers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_shares" ADD CONSTRAINT "account_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_statements" ADD CONSTRAINT "account_statements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_statements" ADD CONSTRAINT "account_statements_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_statements" ADD CONSTRAINT "account_statements_suggestedAccountId_fkey" FOREIGN KEY ("suggestedAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_prices" ADD CONSTRAINT "security_prices_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_parentEntryId_fkey" FOREIGN KEY ("parentEntryId") REFERENCES "entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_reconciledByStatementId_fkey" FOREIGN KEY ("reconciledByStatementId") REFERENCES "account_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_inflowTransactionId_fkey" FOREIGN KEY ("inflowTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_outflowTransactionId_fkey" FOREIGN KEY ("outflowTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejected_transfers" ADD CONSTRAINT "rejected_transfers_inflowTransactionId_fkey" FOREIGN KEY ("inflowTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejected_transfers" ADD CONSTRAINT "rejected_transfers_outflowTransactionId_fkey" FOREIGN KEY ("outflowTransactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_merchant_associations" ADD CONSTRAINT "family_merchant_associations_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_merchant_associations" ADD CONSTRAINT "family_merchant_associations_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "rule_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_actions" ADD CONSTRAINT "rule_actions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_runs" ADD CONSTRAINT "rule_runs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_allocations" ADD CONSTRAINT "recurring_allocations_recurringOccurrenceId_fkey" FOREIGN KEY ("recurringOccurrenceId") REFERENCES "recurring_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_allocations" ADD CONSTRAINT "recurring_allocations_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_match_rejections" ADD CONSTRAINT "recurring_match_rejections_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_match_rejections" ADD CONSTRAINT "recurring_match_rejections_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_price_changes" ADD CONSTRAINT "recurring_price_changes_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_price_changes" ADD CONSTRAINT "recurring_price_changes_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_shares" ADD CONSTRAINT "budget_shares_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_shares" ADD CONSTRAINT "budget_shares_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_accounts" ADD CONSTRAINT "goal_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_accounts" ADD CONSTRAINT "goal_accounts_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_pledges" ADD CONSTRAINT "goal_pledges_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_pledges" ADD CONSTRAINT "goal_pledges_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_pledges" ADD CONSTRAINT "goal_pledges_matchedTransactionId_fkey" FOREIGN KEY ("matchedTransactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_accountStatementId_fkey" FOREIGN KEY ("accountStatementId") REFERENCES "account_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "import_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_mappings" ADD CONSTRAINT "import_mappings_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "import_source_mappings_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "import_source_mappings_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "import_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_exports" ADD CONSTRAINT "family_exports_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syncs" ADD CONSTRAINT "syncs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "syncs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usages" ADD CONSTRAINT "llm_usages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES "eval_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_samples" ADD CONSTRAINT "eval_samples_evalDatasetId_fkey" FOREIGN KEY ("evalDatasetId") REFERENCES "eval_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES "eval_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_evalSampleId_fkey" FOREIGN KEY ("evalSampleId") REFERENCES "eval_samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey

-- AddForeignKey

-- CheckConstraints (ported 1:1 from source chk_*; enum-redundant ones omitted)
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_byte_size_max" CHECK ("byteSize" <= 26214400);
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_byte_size_positive" CHECK ("byteSize" > 0);
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_content_sha256" CHECK ("contentSha256" IS NULL OR "contentSha256"::text ~ '^[0-9a-f]{64}$'::text);
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_match_confidence" CHECK ("matchConfidence" IS NULL OR ("matchConfidence" >= 0::numeric AND "matchConfidence" <= 1::numeric));
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_parser_confidence" CHECK ("parserConfidence" IS NULL OR ("parserConfidence" >= 0::numeric AND "parserConfidence" <= 1::numeric));
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_period_order" CHECK ("periodStartOn" IS NULL OR "periodEndOn" IS NULL OR "periodStartOn" <= "periodEndOn");
ALTER TABLE "account_statements" ADD CONSTRAINT "chk_account_statements_source" CHECK ("source"::text = 'manual_upload'::text);

ALTER TABLE "budget_categories" ADD CONSTRAINT "chk_budget_categories_rolled_over_amount_non_negative" CHECK ("rolledOverAmount" >= 0::numeric);

ALTER TABLE "entries" ADD CONSTRAINT "chk_entries_reconciled_at_present_when_statement_set" CHECK ("reconciledByStatementId" IS NULL OR "reconciledAt" IS NOT NULL);

ALTER TABLE "families" ADD CONSTRAINT "month_start_day_range" CHECK ("monthStartDay" >= 1 AND "monthStartDay" <= 28);

ALTER TABLE "goal_accounts" ADD CONSTRAINT "chk_goal_accounts_allocation_non_negative" CHECK ("allocatedAmount" IS NULL OR "allocatedAmount" >= 0::numeric);

ALTER TABLE "goal_pledges" ADD CONSTRAINT "chk_goal_pledges_amount_positive" CHECK ("amount" > 0::numeric);

ALTER TABLE "goals" ADD CONSTRAINT "chk_savings_goals_name_length" CHECK (char_length("name"::text) <= 255);
ALTER TABLE "goals" ADD CONSTRAINT "chk_goals_consumed_amount_non_negative" CHECK ("consumedAmount" >= 0::numeric);
ALTER TABLE "goals" ADD CONSTRAINT "chk_savings_goals_target_amount_positive" CHECK ("targetAmount" > 0::numeric);

ALTER TABLE "import_rows" ADD CONSTRAINT "chk_import_rows_source_row_number_positive" CHECK ("sourceRowNumber" > 0);

ALTER TABLE "import_sessions" ADD CONSTRAINT "chk_import_sessions_client_session_id_present" CHECK ("clientSessionId" IS NULL OR btrim("clientSessionId"::text) <> ''::text);
ALTER TABLE "import_sessions" ADD CONSTRAINT "chk_import_sessions_expected_chunks_positive" CHECK ("expectedChunks" IS NULL OR "expectedChunks" > 0);
ALTER TABLE "import_sessions" ADD CONSTRAINT "chk_import_sessions_import_type" CHECK ("importType"::text = 'SureImport'::text);
ALTER TABLE "import_sessions" ADD CONSTRAINT "chk_import_sessions_error_details_object" CHECK (jsonb_typeof("errorDetails") = 'object'::text);
ALTER TABLE "import_sessions" ADD CONSTRAINT "chk_import_sessions_summary_object" CHECK (jsonb_typeof("summary") = 'object'::text);

ALTER TABLE "import_source_mappings" ADD CONSTRAINT "chk_import_source_mappings_source_id_present" CHECK (btrim("sourceId"::text) <> ''::text);
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "chk_import_source_mappings_source_type_present" CHECK (btrim("sourceType"::text) <> ''::text);
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "chk_import_source_mappings_target_type_present" CHECK (btrim("targetType"::text) <> ''::text);
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "chk_import_source_mappings_source_type" CHECK ("sourceType"::text = ANY (ARRAY['Account'::character varying, 'Category'::character varying, 'Tag'::character varying, 'Merchant'::character varying, 'RecurringTransaction'::character varying, 'RecurringOccurrence'::character varying, 'Transaction'::character varying, 'Budget'::character varying, 'Security'::character varying, 'Rule'::character varying]::text[]));
ALTER TABLE "import_source_mappings" ADD CONSTRAINT "chk_import_source_mappings_target_type" CHECK ("targetType"::text = ANY (ARRAY['Account'::character varying, 'Category'::character varying, 'Tag'::character varying, 'Merchant'::character varying, 'RecurringTransaction'::character varying, 'RecurringOccurrence'::character varying, 'Transaction'::character varying, 'Budget'::character varying, 'Security'::character varying, 'Rule'::character varying]::text[]));

ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_checksum_sha256_length" CHECK ("checksum" IS NULL OR length("checksum"::text) = 64);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_client_chunk_id_present" CHECK ("clientChunkId" IS NULL OR btrim("clientChunkId"::text) <> ''::text);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_session_checksum_present" CHECK ("importSessionId" IS NULL OR "checksum" IS NOT NULL);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_session_sequence_present" CHECK ("importSessionId" IS NULL OR "sequence" IS NOT NULL);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_error_details_object" CHECK (jsonb_typeof("errorDetails") = 'object'::text);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_summary_object" CHECK (jsonb_typeof("summary") = 'object'::text);
ALTER TABLE "imports" ADD CONSTRAINT "chk_imports_session_sequence_positive" CHECK ("sequence" IS NULL OR "sequence" > 0);

ALTER TABLE "llm_usages" ADD CONSTRAINT "chk_llm_usages_cache_creation_tokens_non_negative" CHECK ("cacheCreationTokens" IS NULL OR "cacheCreationTokens" >= 0);
ALTER TABLE "llm_usages" ADD CONSTRAINT "chk_llm_usages_cache_read_tokens_non_negative" CHECK ("cacheReadTokens" IS NULL OR "cacheReadTokens" >= 0);

ALTER TABLE "onchain_wallet_accounts" ADD CONSTRAINT "chk_onchain_wallet_accounts_token_has_contract" CHECK (("assetKind")::text = 'native'::text OR "contractAddress" IS NOT NULL);

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "chk_push_subscriptions_platform" CHECK ("platform"::text = 'ios'::text);

ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_single_day_spec" CHECK (NOT ("dayOfMonth" IS NOT NULL AND "weekday" IS NOT NULL));
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_interval_positive" CHECK ("interval" > 0);
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_day_of_month_range" CHECK ("dayOfMonth" IS NULL OR ("dayOfMonth" >= '-1'::integer AND "dayOfMonth" <= 31 AND "dayOfMonth" <> 0));
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_month_of_year_range" CHECK ("monthOfYear" IS NULL OR ("monthOfYear" >= 1 AND "monthOfYear" <= 12));
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_weekday_range" CHECK ("weekday" IS NULL OR ("weekday" >= 0 AND "weekday" <= 6));
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_ordinal_requires_weekday" CHECK ("weekdayOrdinal" IS NULL OR "weekday" IS NOT NULL);
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "chk_recurrence_rules_weekday_ordinal_range" CHECK ("weekdayOrdinal" IS NULL OR ("weekdayOrdinal" >= '-1'::integer AND "weekdayOrdinal" <= 5 AND "weekdayOrdinal" <> 0));

ALTER TABLE "recurring_allocations" ADD CONSTRAINT "chk_recurring_allocations_amount_positive" CHECK ("allocatedAmount" > 0::numeric);

ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "chk_recurring_occurrences_closed_state" CHECK (((status)::text = 'scheduled'::text) = ("closedAt" IS NULL));

ALTER TABLE "recurring_transactions" ADD CONSTRAINT "chk_recurring_txns_transfer_requires_source" CHECK ("destinationAccountId" IS NULL OR "accountId" IS NOT NULL);
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "chk_recurring_txns_transfer_distinct_accounts" CHECK ("destinationAccountId" IS NULL OR "destinationAccountId" <> "accountId");

ALTER TABLE "transfers" ADD CONSTRAINT "check_transfer_amount_non_negative" CHECK ("amount" >= 0::numeric);

ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "chk_webauthn_credentials_sign_count_non_negative" CHECK ("signCount" >= 0);
