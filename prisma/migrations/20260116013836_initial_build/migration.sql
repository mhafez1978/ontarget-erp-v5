-- CreateEnum
CREATE TYPE "AddressLabel" AS ENUM ('PRIMARY', 'BILLING', 'SHIPPING', 'OFFICE', 'HOME');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SectionLayout" AS ENUM ('IMAGE_LEFT', 'IMAGE_RIGHT', 'IMAGE_CENTER', 'SPLIT', 'TEXT_ONLY', 'CTA_GRID', 'MEDIA_COVER');

-- CreateEnum
CREATE TYPE "BackgroundStyle" AS ENUM ('SOLID_COLOR', 'GRADIENT', 'IMAGE_COVER', 'IMAGE_COVER_OVERLAY', 'TRANSPARENT');

-- CreateEnum
CREATE TYPE "SectionKind" AS ENUM ('HERO', 'ABOUT', 'FOOD_MENU', 'LOGGED_IN_TOP_NAVBAR', 'LOGGED_OUT_TOP_NAVBAR', 'LOGGED_IN_SIDE_NAVBAR', 'LOGGED_OUT_SIDE_NAVBAR', 'LOGGED_IN_MOBILE_NAVBAR', 'LOGGED_OUT_MOBILE_NAVBAR', 'TESTIMONIAL', 'CTA', 'GALLERY', 'SERVICES', 'FEEDBACK', 'CUSTOM', 'PRODUCTS', 'TEAM', 'PRICING', 'FAQ', 'CONTACT', 'VALUE_PROP', 'CTA_PRIMARY', 'LEAD_CAPTURE', 'COMPARISON', 'CASE_STUDIES', 'CLIENT_LOGOS');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('PENDING', 'GENERATED', 'ACCEPTED', 'REJECTED', 'EDITED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRAVEL', 'MEALS', 'OFFICE_SUPPLIES', 'EQUIPMENT', 'SOFTWARE', 'UTILITIES', 'RENT', 'INSURANCE', 'MARKETING', 'PROFESSIONAL_SERVICES', 'TAXES', 'PAYROLL', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('SUPER_ADMIN', 'ADMIN_OWNER', 'ADMIN_NONOWNER', 'COMPANY_MANAGER', 'COMPANY_STAFF', 'ERP_CUSTOMER', 'COMPANY_CUSTOMER', 'COMPANY_CONTRACTOR', 'COMPANY_SUPPLIER', 'ESSENTIAL', 'GROWTH', 'ENTERPRISE', 'TRIAL');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('SUPER_ADMIN', 'ERP_CUSTOMER', 'ADMIN_OWNER', 'ADMIN_NONOWNER', 'COMPANY_MANAGER', 'COMPANY_STAFF', 'COMPANY_CONTRACTOR', 'COMPANY_SUPPLIER', 'COMPANY_CUSTOMER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SSN_CARD', 'DRIVERS_LICENSE', 'PASSPORT', 'BIRTH_CERTIFICATE', 'WORK_AUTHORIZATION', 'W4_TAX_FORM', 'STATE_TAX_FORM', 'I9_FORM', 'DIRECT_DEPOSIT_FORM', 'EMPLOYEE_HANDBOOK_SIGNED', 'NDA_SIGNED', 'CONTRACT_SIGNED', 'INSURANCE_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('IN_PROGRESS', 'PENDING', 'IN_REVIEW', 'NEEDS_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "FolderType" AS ENUM ('SHARED', 'EMPLOYEE', 'COMPANY_CONTRACTOR', 'SUPPLIER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('INTERNAL', 'COMPANY_CUSTOMER');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('INTERNAL', 'WEB_DEVELOPMENT', 'MOBILE_APP', 'ECOMMERCE', 'BRANDING', 'MARKETING', 'SEO', 'SOCIAL_MEDIA', 'CONTENT_CREATION', 'VIDEO_PRODUCTION', 'GRAPHIC_DESIGN', 'UI_UX_DESIGN', 'SOFTWARE_DEVELOPMENT', 'CONSULTING', 'REAL_ESTATE', 'CONSTRUCTION', 'ARCHITECTURE', 'ENGINEERING', 'MANUFACTURING', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'LEGAL', 'HOSPITALITY', 'RETAIL', 'LOGISTICS', 'EVENT_PLANNING', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectEntryType" AS ENUM ('EXPENSE', 'PRODUCT', 'SERVICE', 'PURCHASE', 'SUBSCRIPTION_SERVICE', 'HOURS_WORKED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('BACKLOG', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ERP_CUSTOMER', 'ADMIN_OWNER', 'ADMIN_NONOWNER', 'COMPANY_MANAGER', 'COMPANY_STAFF', 'COMPANY_CONTRACTOR', 'COMPANY_SUPPLIER', 'COMPANY_CUSTOMER');

-- CreateEnum
CREATE TYPE "EmailProviderType" AS ENUM ('NODEMAILER', 'SMTP', 'GMAIL', 'GOOGLE_OAUTH', 'OFFICE365', 'SENDGRID', 'MAILGUN', 'AWS_SES', 'RESEND');

-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('LOCAL', 'GOOGLE_DRIVE', 'ONEDRIVE', 'AWS_S3', 'DIGITAL_OCEAN');

-- CreateEnum
CREATE TYPE "CaptchaProviderType" AS ENUM ('GOOGLE_RECAPTCHA');

-- CreateEnum
CREATE TYPE "ImageProviderType" AS ENUM ('UNSPLASH', 'PEXELS');

-- CreateEnum
CREATE TYPE "HederaNetwork" AS ENUM ('MAINNET', 'PREVIEWNET', 'TESTNET');

-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('PASSWORD_RESET', 'WELCOME_CUSTOMER', 'WELCOME_STAFF', 'ACCOUNT_VERIFICATION', 'VERIFY_EMAIL', 'PASSWORD_CHANGED', 'INVOICE_SENT', 'PAYMENT_RECEIVED', 'APPOINTMENT_REMINDER', 'BLACK_FRIDAY_SALE', 'CHRISTMAS_SALE', 'NEW_YEAR_SALE', 'VALENTINES_DAY_SALE', 'SPRING_SALE', 'SUMMER_SALE', 'FALL_SALE', 'CYBER_MONDAY_SALE', 'MEMORIAL_DAY_SALE', 'INDEPENDENCE_DAY_SALE', 'LABOR_DAY_SALE', 'THANKSGIVING_SALE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('TRANSACTIONAL', 'INTERNAL_ONLY', 'PRESS_RELEASE', 'NEWSLETTER', 'EMAIL_MARKETING', 'SEASONAL', 'BUSINESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SUBSCRIPTION', 'TRIAL_SUBSCRIPTION', 'STOREFRONT', 'ERP_CUSTOMER', 'COMPANY_CUSTOMER', 'ERP_VENDOR', 'COMPANY_VENDOR', 'ROOT_COMPANY_CONTRACTOR', 'ROOT_COMPANY_VENDOR', 'COMPANY_CONTRACTOR', 'CUSTOM', 'RECURRING', 'TEST_INVOICE');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHAIN_ANCHORED');

-- CreateEnum
CREATE TYPE "StorefrontOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CompanyLegalEntity" AS ENUM ('SOLE_PROPRIETOR', 'SINGLE_MEMBER_LLC', 'LLC', 'S_CORP', 'C_CORP', 'GENERAL_PARTNERSHIP', 'LIMITED_PARTNERSHIP', 'LLP', 'NON_PROFIT', 'LTD', 'PLC', 'GMBH', 'AG', 'UG', 'KG', 'OHG', 'SARL', 'SA', 'SAS', 'SASU', 'EURL', 'SNC', 'SL', 'SA_SPAIN', 'LDA', 'SA_PORTUGAL', 'SRL', 'SPA', 'SRLS', 'BV', 'NV', 'VOF', 'AB', 'AS', 'APS', 'AS_DENMARK', 'OY', 'SPZOO', 'SA_POLAND', 'SRO', 'AS_CZECH', 'PTY_LTD', 'PVT_LTD', 'PUBLIC_LTD', 'SDN_BHD', 'BHD', 'PTE_LTD', 'KK', 'GK', 'SA_LATIN', 'SRL_LATIN', 'LTDA', 'SA_BRAZIL', 'EIRELI', 'MEI', 'LLC_MENA', 'FZE', 'FZCO', 'WLL', 'COOPERATIVE', 'TRUST', 'FOUNDATION', 'ASSOCIATION', 'JOINT_VENTURE', 'BRANCH', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyIndustry" AS ENUM ('SOFTWARE_DEVELOPMENT', 'SAAS', 'IT_SERVICES', 'CYBERSECURITY', 'AI_ML', 'CLOUD_COMPUTING', 'MOBILE_APPS', 'WEB_DEVELOPMENT', 'GAME_DEVELOPMENT', 'BLOCKCHAIN', 'HEALTHCARE', 'MEDICAL_DEVICES', 'PHARMACEUTICALS', 'TELEHEALTH', 'HEALTH_INSURANCE', 'DENTAL', 'VETERINARY', 'FITNESS', 'BANKING', 'FINTECH', 'INSURANCE', 'ACCOUNTING', 'INVESTMENT', 'CRYPTOCURRENCY', 'PAYMENT_PROCESSING', 'ECOMMERCE', 'RETAIL', 'FASHION', 'JEWELRY', 'BEAUTY', 'GROCERY', 'FURNITURE', 'ELECTRONICS', 'MANUFACTURING', 'AUTOMOTIVE', 'AEROSPACE', 'CONSTRUCTION', 'INDUSTRIAL_EQUIPMENT', 'CHEMICALS', 'TEXTILES', 'PACKAGING', 'RESTAURANT', 'CAFE', 'CATERING', 'FOOD_PRODUCTION', 'BREWERY', 'REAL_ESTATE', 'PROPERTY_MANAGEMENT', 'CONSTRUCTION_DEVELOPMENT', 'ARCHITECTURE', 'INTERIOR_DESIGN', 'CONSULTING', 'LEGAL', 'MARKETING', 'PR', 'HR', 'RECRUITMENT', 'BUSINESS_SERVICES', 'EDUCATION', 'ELEARNING', 'TRAINING', 'TUTORING', 'CHILDCARE', 'MEDIA', 'ENTERTAINMENT', 'FILM', 'MUSIC', 'GAMING', 'PODCASTING', 'LOGISTICS', 'SHIPPING', 'TRANSPORTATION', 'DELIVERY', 'WAREHOUSING', 'HOTEL', 'TRAVEL', 'EVENT_PLANNING', 'ENERGY', 'RENEWABLE_ENERGY', 'OIL_GAS', 'SOLAR', 'AGRICULTURE', 'ENVIRONMENTAL', 'SUSTAINABILITY', 'TELECOM', 'ISP', 'NON_PROFIT', 'CHARITY', 'SOCIAL_ENTERPRISE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxIdType" AS ENUM ('SSN', 'EIN', 'ITIN', 'VAT', 'GST', 'ABN', 'ACN', 'TFN', 'NINO', 'UTR', 'CRN', 'TVA', 'NIF', 'CIF', 'SIREN', 'SIRET', 'CNPJ', 'CPF', 'RFC', 'RUT', 'CUIT', 'PAN', 'GSTIN', 'TIN', 'TRN', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyMemberRole" AS ENUM ('SUPER_ADMIN', 'ERP_CUSTOMER', 'ADMIN_OWNER', 'ADMIN_NONOWNER', 'COMPANY_MANAGER', 'COMPANY_STAFF', 'COMPANY_CONTRACTOR', 'COMPANY_SUPPLIER', 'COMPANY_CUSTOMER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR_1099', 'HOURLY', 'INTERN', 'TEMPORARY', 'SEASONAL');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('HEADQUARTERS', 'BRANCH', 'OFFICE', 'WAREHOUSE', 'STORE', 'REMOTE', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionIpAddress" TEXT,
    "sessionIpv4" TEXT,
    "sessionIpv6" TEXT,
    "sessionCity" TEXT,
    "sessionState" TEXT,
    "sessionCountry" TEXT,
    "sessionCountryFlag" TEXT,
    "sessionUserAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "authMethod" TEXT NOT NULL DEFAULT 'credentials',
    "role" "UserRole" NOT NULL DEFAULT 'ERP_CUSTOMER',
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "trialEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canSetupPersonalEmail" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" JSONB,
    "mfaSetupAt" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capturedIpAddress" TEXT,
    "capturedCity" TEXT,
    "capturedState" TEXT,
    "capturedCountry" TEXT,
    "capturedCountryFlag" TEXT,
    "lastLoginIpAddress" TEXT,
    "lastLoginCity" TEXT,
    "lastLoginState" TEXT,
    "lastLoginCountry" TEXT,
    "lastLoginCountryFlag" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "primaryAddressId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "label" "AddressLabel",
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "companyId" TEXT,
    "companyLocationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPaymentProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPaymentProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "slogan" TEXT,
    "description" TEXT,
    "industry" "CompanyIndustry",
    "logo" TEXT,
    "logoLight" TEXT,
    "logoDark" TEXT,
    "uploadedLogos" JSONB,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "salesEmail" TEXT,
    "supportEmail" TEXT,
    "isRoot" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT,
    "subdomain" TEXT,
    "customDomain" TEXT,
    "isStoreEnabled" BOOLEAN NOT NULL DEFAULT false,
    "storeTheme" TEXT DEFAULT 'default',
    "storeBanner" TEXT,
    "storeMetadata" JSONB,
    "storeBlogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "storeConfiguredAt" TIMESTAMP(3),
    "storeConfiguredBy" TEXT,
    "aiStorefrontEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiStorefrontSpec" JSONB,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ownerId" TEXT NOT NULL,
    "stripeConnectedAccountId" TEXT,
    "stripeAccountStatus" TEXT DEFAULT 'not_connected',
    "stripeOnboardedAt" TIMESTAMP(3),
    "customPlatformFeePercent" DECIMAL(5,2),
    "storageBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "storageUsedGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageProvider" TEXT DEFAULT 'INHERIT',
    "storageConfig" JSONB,
    "storageConfiguredAt" TIMESTAMP(3),
    "storageConfiguredBy" TEXT,
    "foundedYear" INTEGER,
    "employeeCount" INTEGER,
    "instagramFollowers" INTEGER,
    "facebookLikes" INTEGER,
    "linkedinFollowers" INTEGER,
    "youtubeSubscribers" INTEGER,
    "trustpilotRating" DOUBLE PRECISION,
    "googleRating" DOUBLE PRECISION,
    "certifications" JSONB,
    "awards" JSONB,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "primaryAddressId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTaxInfo" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legalEntity" "CompanyLegalEntity" NOT NULL,
    "taxIdType" "TaxIdType" NOT NULL,
    "taxId" TEXT NOT NULL,
    "taxCountry" TEXT,
    "vatNumber" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTaxInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiStorefrontGenerationLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiStorefrontGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "V4Conversation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'greeting',
    "heroStyle" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontPairing" TEXT,
    "designStyle" TEXT,
    "sections" JSONB,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "V4Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "V4Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "V4Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "V4Website" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversationId" TEXT,
    "userId" TEXT NOT NULL,
    "websiteData" JSONB NOT NULL,
    "preferences" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creativityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "V4Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "heroImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportArticle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "featuredImage" TEXT,
    "content" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerTitle" TEXT,
    "customerPhoto" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "testimonial" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "rootCompanyId" TEXT NOT NULL,
    "subscriberCompanyId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'ESSENTIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "trialEndsAt" TIMESTAMP(3),
    "billingCycleStart" TIMESTAMP(3),
    "billingCycleEnd" TIMESTAMP(3),
    "externalSubscriptionId" TEXT,
    "promoCodeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'BRANCH',
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "hours" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "primaryAddressId" TEXT,

    CONSTRAINT "CompanyLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyMemberRole" NOT NULL DEFAULT 'COMPANY_STAFF',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyStaff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyMemberRole" NOT NULL DEFAULT 'COMPANY_STAFF',
    "jobTitle" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminationDate" TIMESTAMP(3),
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "countryFlag" TEXT,
    "notes" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "displayOrder" INTEGER DEFAULT 0,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "canReceivePayroll" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "payrollJurisdictionId" TEXT,
    "employmentClassification" TEXT,
    "payRate" DECIMAL(10,2),
    "payFrequency" TEXT DEFAULT 'HOURLY',
    "currency" TEXT DEFAULT 'USD',
    "taxWithholdingConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "userId" TEXT,
    "companyId" TEXT,
    "ipAddress" TEXT,
    "deletedAt" TIMESTAMP(3),
    "ipv4" TEXT,
    "ipv6" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryFlag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoTrackingSetting" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'IP_API',
    "apiKey" TEXT,
    "apiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoTrackingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoLocationRecord" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "provider" TEXT NOT NULL,
    "providerRaw" JSONB,
    "city" TEXT,
    "region" TEXT,
    "regionName" TEXT,
    "district" TEXT,
    "zip" TEXT,
    "countryName" TEXT,
    "countryCode" TEXT,
    "continent" TEXT,
    "continentCode" TEXT,
    "isp" TEXT,
    "org" TEXT,
    "as" TEXT,
    "asName" TEXT,
    "mobile" BOOLEAN,
    "proxy" BOOLEAN,
    "hosting" BOOLEAN,
    "dnsGeo" TEXT,
    "dnsIp" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoLocationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthProviderSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyOAuthSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyOAuthSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorTracking" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryFlag" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(13,2),
    "markupPercent" DECIMAL(5,2),
    "markupAmount" DECIMAL(13,2),
    "profitMarginPercent" DECIMAL(5,2),
    "sku" TEXT,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER DEFAULT 10,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "companyLocationId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(13,2),
    "markupPercent" DECIMAL(5,2),
    "markupAmount" DECIMAL(13,2),
    "profitMarginPercent" DECIMAL(5,2),
    "duration" TEXT,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "status" "StorefrontOrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "itemName" TEXT NOT NULL,
    "itemSku" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "publicKey" TEXT,
    "secretKey" TEXT,
    "webhookSecret" TEXT,
    "merchantId" TEXT,
    "stripeConnectClientId" TEXT,
    "config" JSONB,
    "configuredBy" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaidAccount" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "accountMask" TEXT,
    "accountType" TEXT,
    "accountSubtype" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedBy" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaidAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "externalInvoiceId" TEXT,
    "externalInvoiceUrl" TEXT,
    "type" "InvoiceType" NOT NULL DEFAULT 'CUSTOM',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "customerEmail" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "items" JSONB NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "terms" TEXT,
    "internalNotes" TEXT,
    "createdBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "fileRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "invoiceId" TEXT,
    "orderId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "gatewayReference" TEXT,
    "gatewayResponse" JSONB,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "refundReference" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhook" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "paymentId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedLoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "countryFlag" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "userAgent" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpBlacklist" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "countryFlag" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "blockedById" TEXT,
    "isAutoBlocked" BOOLEAN NOT NULL DEFAULT true,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IpBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageProvider" (
    "id" TEXT NOT NULL,
    "provider" "StorageProviderType" NOT NULL DEFAULT 'LOCAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "enableGlobalBackup" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProviderConfig" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "ltxApiKey" TEXT,
    "ltxSecret" TEXT,
    "ltxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hfApiToken" TEXT,
    "hfEnabled" BOOLEAN NOT NULL DEFAULT false,
    "primaryProvider" TEXT DEFAULT 'ltx',
    "lastTestedAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoGenerationJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "duration" INTEGER DEFAULT 4,
    "resolution" TEXT DEFAULT '1920x1080',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "resultUrl" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoGenerationLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontConversation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "toolsUsed" JSONB,
    "specVersionId" TEXT,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "isPreviewOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorefrontMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontSpecVersion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spec" JSONB,
    "createdBy" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "title" TEXT,
    "source" TEXT DEFAULT 'ai',

    CONSTRAINT "StorefrontSpecVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "message" TEXT,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staus" "LeadStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "events" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "payload" JSON NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorefrontWebsiteV3" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "websiteData" JSON NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "seoCompliant" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityCompliant" BOOLEAN NOT NULL DEFAULT false,
    "validationWarnings" JSON,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "StorefrontWebsiteV3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageProvider" (
    "id" TEXT NOT NULL,
    "provider" "ImageProviderType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL,
    "companyId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProvider" (
    "id" TEXT NOT NULL,
    "provider" "EmailProviderType" NOT NULL DEFAULT 'SMTP',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "sendgridApiKey" TEXT,
    "mailgunApiKey" TEXT,
    "mailgunDomain" TEXT,
    "awsRegion" TEXT,
    "awsAccessKey" TEXT,
    "awsSecretKey" TEXT,
    "resendApiKey" TEXT,
    "office365TenantId" TEXT,
    "office365ClientId" TEXT,
    "office365ClientSecret" TEXT,
    "office365FromEmail" TEXT,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "googleFromEmail" TEXT,
    "googleRefreshToken" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyToEmail" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptchaProvider" (
    "id" TEXT NOT NULL,
    "provider" "CaptchaProviderType" NOT NULL DEFAULT 'GOOGLE_RECAPTCHA',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "siteKey" TEXT,
    "secretKey" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptchaProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEmailProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "EmailProviderType" NOT NULL DEFAULT 'SMTP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canSendAdHoc" BOOLEAN NOT NULL DEFAULT true,
    "canSendMarketing" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "office365TenantId" TEXT,
    "office365ClientId" TEXT,
    "office365ClientSecret" TEXT,
    "office365AccessToken" TEXT,
    "office365RefreshToken" TEXT,
    "office365TokenExpiry" TIMESTAMP(3),
    "office365FromEmail" TEXT,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" TIMESTAMP(3),
    "googleFromEmail" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyToEmail" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEmailProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "apiKey" TEXT NOT NULL,
    "model" TEXT,
    "apiBase" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HederaSetting" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "hederaAccount" TEXT,
    "topicId" TEXT,
    "evmAddress" TEXT,
    "keyType" TEXT,
    "hederaHexKey" TEXT,
    "hederaDerKey" TEXT,
    "hederaDerPub" TEXT,
    "hashSalt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "network" "HederaNetwork" NOT NULL DEFAULT 'TESTNET',
    "currentBalance" DECIMAL(20,8),
    "lowBalanceThreshold" DECIMAL(20,8) NOT NULL DEFAULT 10,
    "lastBalanceCheck" TIMESTAMP(3),
    "balanceAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCostPerTx" DECIMAL(20,8) NOT NULL DEFAULT 0.0001,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalCostHbar" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HederaSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyHederaSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "historicalAnchored" BOOLEAN NOT NULL DEFAULT false,
    "historicalJobId" TEXT,
    "enabledById" TEXT,
    "enabledAt" TIMESTAMP(3),
    "monthlyBudgetHbar" DECIMAL(20,8),
    "currentMonthSpent" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "budgetResetDate" TIMESTAMP(3),
    "budgetExceeded" BOOLEAN NOT NULL DEFAULT false,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompanyHederaSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HederaCompanyAudit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HederaCompanyAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HederaTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "hash" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "transactionId" TEXT,
    "consensusTimestamp" TIMESTAMP(3),
    "costHbar" DECIMAL(20,8),
    "balanceAfter" DECIMAL(20,8),
    "auditLogId" TEXT,
    "outboxJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HederaTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HederaCostAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "companyId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HederaCostAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "runAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'TRANSACTIONAL',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "contentBlocks" JSONB,
    "variables" JSONB,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isCustomHtml" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'COMPANY_STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "companyId" TEXT NOT NULL,
    "subscriberCompanyId" TEXT,
    "customerId" TEXT,
    "projectManagerId" TEXT,
    "teamLeadId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "projectType" "ProjectType" NOT NULL DEFAULT 'INTERNAL',
    "category" "ProjectCategory" NOT NULL DEFAULT 'INTERNAL',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "estimatedCost" DECIMAL(13,2),
    "estimatedMarkup" DECIMAL(13,2),
    "featuredImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeEntry" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "timeEntry" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "documentType" "DocumentType",
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFinancialEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entryType" "ProjectEntryType" NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "referenceId" TEXT,
    "amount" DECIMAL(13,2) NOT NULL,
    "cost" DECIMAL(13,2) NOT NULL,
    "markupPercent" DECIMAL(5,2),
    "markupAmount" DECIMAL(13,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "occurrenceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentDocument" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "docType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "primaryPath" TEXT NOT NULL,
    "backupPath" TEXT,
    "storageProvider" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "step1Complete" BOOLEAN NOT NULL DEFAULT false,
    "step2Complete" BOOLEAN NOT NULL DEFAULT false,
    "step3Complete" BOOLEAN NOT NULL DEFAULT false,
    "step4Complete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthOnboarding" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedPlan" TEXT,
    "context" TEXT NOT NULL DEFAULT 'root',
    "companyId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "breakStart" TIMESTAMP(3),
    "breakEnd" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER,
    "totalHours" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "payrollEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileFolder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "FolderType" NOT NULL DEFAULT 'CUSTOM',
    "ownerId" TEXT,
    "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRecord" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "primaryPath" TEXT NOT NULL,
    "backupPath" TEXT,
    "storageProvider" TEXT NOT NULL,
    "uploadedById" TEXT,
    "description" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPayroll" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "plaidAccessToken" TEXT,
    "plaidItemId" TEXT,
    "plaidAccountId" TEXT,
    "bankName" TEXT,
    "accountLast4" TEXT,
    "accountType" TEXT,
    "stripeAccountId" TEXT,
    "stripeConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxRegion" TEXT,
    "taxRate" DECIMAL(5,2),
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "pdfUrl" TEXT,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollJurisdiction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regionCode" TEXT,
    "taxConfig" JSONB NOT NULL,
    "requiredForms" JSONB,
    "filingFrequency" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollJurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "grossAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxWithheld" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxRegion" TEXT,
    "taxBreakdown" JSONB,
    "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "stripeTransferId" TEXT,
    "notes" TEXT,
    "jurisdictionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "hoursWorked" DECIMAL(8,2),
    "overtimeHours" DECIMAL(8,2),
    "deductionsBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseEntry" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "staffId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "receiptUrls" JSONB,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "accountType" "AccountType" NOT NULL,
    "accountName" TEXT NOT NULL,
    "debitAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "category" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPricing" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "monthlyPromoPrice" DOUBLE PRECISION,
    "annualPrice" DOUBLE PRECISION NOT NULL,
    "annualPriceMonthly" DOUBLE PRECISION NOT NULL,
    "transactionFeePercent" DOUBLE PRECISION NOT NULL,
    "transactionFeeFixed" DOUBLE PRECISION NOT NULL,
    "baseStorageGB" INTEGER NOT NULL,
    "extraStoragePricePer100GB" DOUBLE PRECISION NOT NULL,
    "extraStoragePricePerGB" DOUBLE PRECISION NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PlanPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "flatFeeAmount" DECIMAL(10,2),
    "percentageOff" INTEGER,
    "freeTrialDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "promptTemplate" TEXT,
    "defaultModel" TEXT,
    "promptVersion" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVocabulary" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "singularLabel" TEXT NOT NULL,
    "pluralLabel" TEXT NOT NULL,
    "schemaOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedSection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pageId" TEXT,
    "personaId" TEXT,
    "kind" "SectionKind" NOT NULL,
    "layout" "SectionLayout",
    "background" "BackgroundStyle",
    "backgroundConfig" JSONB,
    "componentName" TEXT,
    "schema" JSONB NOT NULL,
    "props" JSONB,
    "variants" JSONB,
    "assets" JSONB,
    "status" "SectionStatus" NOT NULL DEFAULT 'PENDING',
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPageDraft" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pageId" TEXT,
    "pageSlug" TEXT,
    "pageTitle" TEXT,
    "name" TEXT,
    "sections" JSONB NOT NULL,
    "meta" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedPageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionKind" "SectionKind" NOT NULL,
    "personaId" TEXT,
    "inputPrompt" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "logs" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta" JSONB,
    "publishedDraftId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pageId" TEXT,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "serviceId" TEXT,
    "title" TEXT NOT NULL,
    "timezone" TEXT,
    "recurrence" JSONB,
    "slots" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "slotEnd" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyToPayrollJurisdiction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompanyToPayrollJurisdiction_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_provider_idx" ON "Account"("provider");

-- CreateIndex
CREATE INDEX "Account_isPrimary_idx" ON "Account"("isPrimary");

-- CreateIndex
CREATE INDEX "Account_lastUsedAt_idx" ON "Account"("lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_expires_idx" ON "Session"("userId", "expires");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryAddressId_key" ON "User"("primaryAddressId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_companyId_idx" ON "Address"("companyId");

-- CreateIndex
CREATE INDEX "Address_companyLocationId_idx" ON "Address"("companyLocationId");

-- CreateIndex
CREATE INDEX "Address_countryCode_idx" ON "Address"("countryCode");

-- CreateIndex
CREATE INDEX "Address_postalCode_idx" ON "Address"("postalCode");

-- CreateIndex
CREATE INDEX "CustomerPaymentProvider_userId_idx" ON "CustomerPaymentProvider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPaymentProvider_provider_externalId_key" ON "CustomerPaymentProvider"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_expires_idx" ON "PasswordReset"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_subdomain_key" ON "Company"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Company_customDomain_key" ON "Company"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Company_stripeConnectedAccountId_key" ON "Company"("stripeConnectedAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_primaryAddressId_key" ON "Company"("primaryAddressId");

-- CreateIndex
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_isRoot_idx" ON "Company"("isRoot");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTaxInfo_companyId_key" ON "CompanyTaxInfo"("companyId");

-- CreateIndex
CREATE INDEX "CompanyTaxInfo_companyId_idx" ON "CompanyTaxInfo"("companyId");

-- CreateIndex
CREATE INDEX "CompanyTaxInfo_taxCountry_idx" ON "CompanyTaxInfo"("taxCountry");

-- CreateIndex
CREATE INDEX "AiStorefrontGenerationLog_companyId_createdAt_idx" ON "AiStorefrontGenerationLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "AiStorefrontGenerationLog_userId_createdAt_idx" ON "AiStorefrontGenerationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "V4Conversation_companyId_idx" ON "V4Conversation"("companyId");

-- CreateIndex
CREATE INDEX "V4Conversation_userId_idx" ON "V4Conversation"("userId");

-- CreateIndex
CREATE INDEX "V4Conversation_companyId_isComplete_idx" ON "V4Conversation"("companyId", "isComplete");

-- CreateIndex
CREATE INDEX "V4Message_conversationId_idx" ON "V4Message"("conversationId");

-- CreateIndex
CREATE INDEX "V4Website_companyId_idx" ON "V4Website"("companyId");

-- CreateIndex
CREATE INDEX "V4Website_conversationId_idx" ON "V4Website"("conversationId");

-- CreateIndex
CREATE INDEX "V4Website_userId_idx" ON "V4Website"("userId");

-- CreateIndex
CREATE INDEX "V4Website_companyId_isActive_idx" ON "V4Website"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "StorefrontPost_companyId_idx" ON "StorefrontPost"("companyId");

-- CreateIndex
CREATE INDEX "StorefrontPost_status_idx" ON "StorefrontPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontPost_companyId_slug_key" ON "StorefrontPost"("companyId", "slug");

-- CreateIndex
CREATE INDEX "SupportArticle_companyId_idx" ON "SupportArticle"("companyId");

-- CreateIndex
CREATE INDEX "SupportArticle_authorId_idx" ON "SupportArticle"("authorId");

-- CreateIndex
CREATE INDEX "SupportArticle_status_idx" ON "SupportArticle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SupportArticle_companyId_slug_key" ON "SupportArticle"("companyId", "slug");

-- CreateIndex
CREATE INDEX "Testimonial_companyId_idx" ON "Testimonial"("companyId");

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");

-- CreateIndex
CREATE INDEX "Testimonial_isFeatured_idx" ON "Testimonial"("isFeatured");

-- CreateIndex
CREATE INDEX "Subscription_rootCompanyId_idx" ON "Subscription"("rootCompanyId");

-- CreateIndex
CREATE INDEX "Subscription_subscriberCompanyId_idx" ON "Subscription"("subscriberCompanyId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");

-- CreateIndex
CREATE INDEX "Subscription_trialEndsAt_idx" ON "Subscription"("trialEndsAt");

-- CreateIndex
CREATE INDEX "Subscription_promoCodeId_idx" ON "Subscription"("promoCodeId");

-- CreateIndex
CREATE INDEX "Subscription_subscriberCompanyId_status_idx" ON "Subscription"("subscriberCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_rootCompanyId_subscriberCompanyId_key" ON "Subscription"("rootCompanyId", "subscriberCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyLocation_primaryAddressId_key" ON "CompanyLocation"("primaryAddressId");

-- CreateIndex
CREATE INDEX "CompanyLocation_companyId_idx" ON "CompanyLocation"("companyId");

-- CreateIndex
CREATE INDEX "CompanyLocation_isMain_idx" ON "CompanyLocation"("isMain");

-- CreateIndex
CREATE INDEX "CompanyLocation_companyId_isMain_idx" ON "CompanyLocation"("companyId", "isMain");

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMember_role_idx" ON "CompanyMember"("role");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_role_idx" ON "CompanyMember"("companyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_userId_companyId_key" ON "CompanyMember"("userId", "companyId");

-- CreateIndex
CREATE INDEX "CompanyStaff_userId_idx" ON "CompanyStaff"("userId");

-- CreateIndex
CREATE INDEX "CompanyStaff_companyId_idx" ON "CompanyStaff"("companyId");

-- CreateIndex
CREATE INDEX "CompanyStaff_role_idx" ON "CompanyStaff"("role");

-- CreateIndex
CREATE INDEX "CompanyStaff_employmentType_idx" ON "CompanyStaff"("employmentType");

-- CreateIndex
CREATE INDEX "CompanyStaff_status_idx" ON "CompanyStaff"("status");

-- CreateIndex
CREATE INDEX "CompanyStaff_hireDate_idx" ON "CompanyStaff"("hireDate");

-- CreateIndex
CREATE INDEX "CompanyStaff_payrollJurisdictionId_idx" ON "CompanyStaff"("payrollJurisdictionId");

-- CreateIndex
CREATE INDEX "CompanyStaff_jobTitle_idx" ON "CompanyStaff"("jobTitle");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyStaff_userId_companyId_key" ON "CompanyStaff"("userId", "companyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_createdAt_idx" ON "AuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "GeoTrackingSetting_enabled_idx" ON "GeoTrackingSetting"("enabled");

-- CreateIndex
CREATE INDEX "GeoTrackingSetting_provider_idx" ON "GeoTrackingSetting"("provider");

-- CreateIndex
CREATE INDEX "GeoLocationRecord_ip_idx" ON "GeoLocationRecord"("ip");

-- CreateIndex
CREATE INDEX "GeoLocationRecord_countryCode_idx" ON "GeoLocationRecord"("countryCode");

-- CreateIndex
CREATE INDEX "GeoLocationRecord_createdAt_idx" ON "GeoLocationRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthProviderSetting_provider_key" ON "OAuthProviderSetting"("provider");

-- CreateIndex
CREATE INDEX "OAuthProviderSetting_provider_idx" ON "OAuthProviderSetting"("provider");

-- CreateIndex
CREATE INDEX "OAuthProviderSetting_enabled_idx" ON "OAuthProviderSetting"("enabled");

-- CreateIndex
CREATE INDEX "CompanyOAuthSetting_companyId_idx" ON "CompanyOAuthSetting"("companyId");

-- CreateIndex
CREATE INDEX "CompanyOAuthSetting_provider_idx" ON "CompanyOAuthSetting"("provider");

-- CreateIndex
CREATE INDEX "CompanyOAuthSetting_enabled_idx" ON "CompanyOAuthSetting"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyOAuthSetting_companyId_provider_key" ON "CompanyOAuthSetting"("companyId", "provider");

-- CreateIndex
CREATE INDEX "VisitorTracking_ipAddress_idx" ON "VisitorTracking"("ipAddress");

-- CreateIndex
CREATE INDEX "VisitorTracking_visitedAt_idx" ON "VisitorTracking"("visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isPublished_idx" ON "Product"("isPublished");

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_isFeatured_idx" ON "ProductImage"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_companyId_idx" ON "Service"("companyId");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_isPublished_idx" ON "Service"("isPublished");

-- CreateIndex
CREATE INDEX "Service_isFeatured_idx" ON "Service"("isFeatured");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "ServiceImage_serviceId_idx" ON "ServiceImage"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceImage_isFeatured_idx" ON "ServiceImage"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");

-- CreateIndex
CREATE INDEX "Cart_sessionId_idx" ON "Cart"("sessionId");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_companyId_idx" ON "Cart"("companyId");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

-- CreateIndex
CREATE INDEX "Cart_userId_companyId_idx" ON "Cart"("userId", "companyId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_serviceId_idx" ON "CartItem"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontOrder_orderNumber_key" ON "StorefrontOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "StorefrontOrder_companyId_idx" ON "StorefrontOrder"("companyId");

-- CreateIndex
CREATE INDEX "StorefrontOrder_userId_idx" ON "StorefrontOrder"("userId");

-- CreateIndex
CREATE INDEX "StorefrontOrder_orderNumber_idx" ON "StorefrontOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "StorefrontOrder_status_idx" ON "StorefrontOrder"("status");

-- CreateIndex
CREATE INDEX "StorefrontOrder_paymentStatus_idx" ON "StorefrontOrder"("paymentStatus");

-- CreateIndex
CREATE INDEX "StorefrontOrder_customerEmail_idx" ON "StorefrontOrder"("customerEmail");

-- CreateIndex
CREATE INDEX "StorefrontOrder_createdAt_idx" ON "StorefrontOrder"("createdAt");

-- CreateIndex
CREATE INDEX "StorefrontOrder_companyId_status_idx" ON "StorefrontOrder"("companyId", "status");

-- CreateIndex
CREATE INDEX "StorefrontOrder_companyId_createdAt_idx" ON "StorefrontOrder"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "StorefrontOrderItem_orderId_idx" ON "StorefrontOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "StorefrontOrderItem_productId_idx" ON "StorefrontOrderItem"("productId");

-- CreateIndex
CREATE INDEX "StorefrontOrderItem_serviceId_idx" ON "StorefrontOrderItem"("serviceId");

-- CreateIndex
CREATE INDEX "PaymentGateway_companyId_idx" ON "PaymentGateway"("companyId");

-- CreateIndex
CREATE INDEX "PaymentGateway_provider_idx" ON "PaymentGateway"("provider");

-- CreateIndex
CREATE INDEX "PaymentGateway_isEnabled_idx" ON "PaymentGateway"("isEnabled");

-- CreateIndex
CREATE INDEX "PlaidAccount_companyId_idx" ON "PlaidAccount"("companyId");

-- CreateIndex
CREATE INDEX "PlaidAccount_accountId_idx" ON "PlaidAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_externalInvoiceId_key" ON "Invoice"("externalInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_fileRecordId_key" ON "Invoice"("fileRecordId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_type_idx" ON "Invoice"("type");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_fileRecordId_idx" ON "Invoice"("fileRecordId");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_gatewayId_idx" ON "Payment"("gatewayId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_gatewayReference_idx" ON "Payment"("gatewayReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhook_eventId_key" ON "PaymentWebhook"("eventId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_provider_idx" ON "PaymentWebhook"("provider");

-- CreateIndex
CREATE INDEX "PaymentWebhook_eventType_idx" ON "PaymentWebhook"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhook_processed_idx" ON "PaymentWebhook"("processed");

-- CreateIndex
CREATE INDEX "PaymentWebhook_eventId_idx" ON "PaymentWebhook"("eventId");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_email_idx" ON "FailedLoginAttempt"("email");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_ipAddress_idx" ON "FailedLoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_attemptedAt_idx" ON "FailedLoginAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_userId_idx" ON "FailedLoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_ipAddress_attemptedAt_idx" ON "FailedLoginAttempt"("ipAddress", "attemptedAt");

-- CreateIndex
CREATE INDEX "FailedLoginAttempt_email_attemptedAt_idx" ON "FailedLoginAttempt"("email", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IpBlacklist_ipAddress_key" ON "IpBlacklist"("ipAddress");

-- CreateIndex
CREATE INDEX "IpBlacklist_ipAddress_idx" ON "IpBlacklist"("ipAddress");

-- CreateIndex
CREATE INDEX "IpBlacklist_blockedUntil_idx" ON "IpBlacklist"("blockedUntil");

-- CreateIndex
CREATE INDEX "StorageProvider_provider_idx" ON "StorageProvider"("provider");

-- CreateIndex
CREATE INDEX "StorageProvider_isActive_idx" ON "StorageProvider"("isActive");

-- CreateIndex
CREATE INDEX "StorageProvider_scope_idx" ON "StorageProvider"("scope");

-- CreateIndex
CREATE INDEX "StorageProvider_companyId_idx" ON "StorageProvider"("companyId");

-- CreateIndex
CREATE INDEX "VideoProviderConfig_scope_idx" ON "VideoProviderConfig"("scope");

-- CreateIndex
CREATE INDEX "VideoGenerationJob_companyId_idx" ON "VideoGenerationJob"("companyId");

-- CreateIndex
CREATE INDEX "VideoGenerationJob_status_idx" ON "VideoGenerationJob"("status");

-- CreateIndex
CREATE INDEX "VideoGenerationLog_jobId_idx" ON "VideoGenerationLog"("jobId");

-- CreateIndex
CREATE INDEX "StorefrontConversation_companyId_idx" ON "StorefrontConversation"("companyId");

-- CreateIndex
CREATE INDEX "StorefrontMessage_conversationId_idx" ON "StorefrontMessage"("conversationId");

-- CreateIndex
CREATE INDEX "StorefrontMessage_specVersionId_idx" ON "StorefrontMessage"("specVersionId");

-- CreateIndex
CREATE INDEX "StorefrontSpecVersion_companyId_idx" ON "StorefrontSpecVersion"("companyId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_companyId_idx" ON "TelemetryEvent"("companyId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_eventType_idx" ON "TelemetryEvent"("eventType");

-- CreateIndex
CREATE INDEX "TelemetryEvent_createdAt_idx" ON "TelemetryEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "WebhookConfig_companyId_idx" ON "WebhookConfig"("companyId");

-- CreateIndex
CREATE INDEX "WebhookConfig_isActive_idx" ON "WebhookConfig"("isActive");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "StorefrontWebsiteV3_companyId_idx" ON "StorefrontWebsiteV3"("companyId");

-- CreateIndex
CREATE INDEX "StorefrontWebsiteV3_companyId_isActive_idx" ON "StorefrontWebsiteV3"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "ImageProvider_companyId_idx" ON "ImageProvider"("companyId");

-- CreateIndex
CREATE INDEX "EmailProvider_provider_idx" ON "EmailProvider"("provider");

-- CreateIndex
CREATE INDEX "EmailProvider_isActive_idx" ON "EmailProvider"("isActive");

-- CreateIndex
CREATE INDEX "EmailProvider_scope_idx" ON "EmailProvider"("scope");

-- CreateIndex
CREATE INDEX "EmailProvider_companyId_idx" ON "EmailProvider"("companyId");

-- CreateIndex
CREATE INDEX "CaptchaProvider_provider_idx" ON "CaptchaProvider"("provider");

-- CreateIndex
CREATE INDEX "CaptchaProvider_isActive_idx" ON "CaptchaProvider"("isActive");

-- CreateIndex
CREATE INDEX "CaptchaProvider_scope_idx" ON "CaptchaProvider"("scope");

-- CreateIndex
CREATE INDEX "CaptchaProvider_companyId_idx" ON "CaptchaProvider"("companyId");

-- CreateIndex
CREATE INDEX "UserEmailProvider_userId_idx" ON "UserEmailProvider"("userId");

-- CreateIndex
CREATE INDEX "UserEmailProvider_isActive_idx" ON "UserEmailProvider"("isActive");

-- CreateIndex
CREATE INDEX "UserEmailProvider_provider_idx" ON "UserEmailProvider"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailProvider_userId_provider_key" ON "UserEmailProvider"("userId", "provider");

-- CreateIndex
CREATE INDEX "AiProviderSetting_scope_provider_idx" ON "AiProviderSetting"("scope", "provider");

-- CreateIndex
CREATE INDEX "HederaSetting_scope_idx" ON "HederaSetting"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyHederaSetting_companyId_key" ON "CompanyHederaSetting"("companyId");

-- CreateIndex
CREATE INDEX "CompanyHederaSetting_companyId_idx" ON "CompanyHederaSetting"("companyId");

-- CreateIndex
CREATE INDEX "HederaCompanyAudit_companyId_idx" ON "HederaCompanyAudit"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "HederaTransaction_hash_key" ON "HederaTransaction"("hash");

-- CreateIndex
CREATE INDEX "HederaTransaction_companyId_idx" ON "HederaTransaction"("companyId");

-- CreateIndex
CREATE INDEX "HederaTransaction_hash_idx" ON "HederaTransaction"("hash");

-- CreateIndex
CREATE INDEX "HederaTransaction_status_idx" ON "HederaTransaction"("status");

-- CreateIndex
CREATE INDEX "HederaTransaction_createdAt_idx" ON "HederaTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "HederaCostAlert_alertType_idx" ON "HederaCostAlert"("alertType");

-- CreateIndex
CREATE INDEX "HederaCostAlert_acknowledged_idx" ON "HederaCostAlert"("acknowledged");

-- CreateIndex
CREATE INDEX "HederaCostAlert_companyId_idx" ON "HederaCostAlert"("companyId");

-- CreateIndex
CREATE INDEX "OutboxJob_status_idx" ON "OutboxJob"("status");

-- CreateIndex
CREATE INDEX "OutboxJob_runAt_idx" ON "OutboxJob"("runAt");

-- CreateIndex
CREATE INDEX "EmailTemplate_type_idx" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailTemplate_scope_idx" ON "EmailTemplate"("scope");

-- CreateIndex
CREATE INDEX "EmailTemplate_companyId_idx" ON "EmailTemplate"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_type_scope_companyId_key" ON "EmailTemplate"("type", "scope", "companyId");

-- CreateIndex
CREATE INDEX "Team_companyId_idx" ON "Team"("companyId");

-- CreateIndex
CREATE INDEX "Team_name_idx" ON "Team"("name");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_staffId_idx" ON "TeamMember"("staffId");

-- CreateIndex
CREATE INDEX "TeamMember_role_idx" ON "TeamMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_staffId_key" ON "TeamMember"("teamId", "staffId");

-- CreateIndex
CREATE INDEX "Project_teamId_idx" ON "Project"("teamId");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_subscriberCompanyId_idx" ON "Project"("subscriberCompanyId");

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "Project"("customerId");

-- CreateIndex
CREATE INDEX "Project_projectManagerId_idx" ON "Project"("projectManagerId");

-- CreateIndex
CREATE INDEX "Project_teamLeadId_idx" ON "Project"("teamLeadId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_companyId_status_idx" ON "Project"("companyId", "status");

-- CreateIndex
CREATE INDEX "Project_companyId_status_sortOrder_idx" ON "Project"("companyId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_isFeatured_idx" ON "Project"("isFeatured");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_order_idx" ON "Task"("order");

-- CreateIndex
CREATE INDEX "ProjectNote_projectId_idx" ON "ProjectNote"("projectId");

-- CreateIndex
CREATE INDEX "ProjectNote_authorId_idx" ON "ProjectNote"("authorId");

-- CreateIndex
CREATE INDEX "ProjectNote_createdAt_idx" ON "ProjectNote"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDocument_uploadedById_idx" ON "ProjectDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ProjectDocument_storageProvider_idx" ON "ProjectDocument"("storageProvider");

-- CreateIndex
CREATE INDEX "ProjectFinancialEntry_projectId_idx" ON "ProjectFinancialEntry"("projectId");

-- CreateIndex
CREATE INDEX "ProjectFinancialEntry_entryType_idx" ON "ProjectFinancialEntry"("entryType");

-- CreateIndex
CREATE INDEX "ProjectFinancialEntry_createdById_idx" ON "ProjectFinancialEntry"("createdById");

-- CreateIndex
CREATE INDEX "EmploymentDocument_staffId_idx" ON "EmploymentDocument"("staffId");

-- CreateIndex
CREATE INDEX "EmploymentDocument_status_idx" ON "EmploymentDocument"("status");

-- CreateIndex
CREATE INDEX "EmploymentDocument_docType_idx" ON "EmploymentDocument"("docType");

-- CreateIndex
CREATE INDEX "EmploymentDocument_uploadedAt_idx" ON "EmploymentDocument"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingToken_token_key" ON "OnboardingToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingToken_staffId_key" ON "OnboardingToken"("staffId");

-- CreateIndex
CREATE INDEX "OnboardingToken_token_idx" ON "OnboardingToken"("token");

-- CreateIndex
CREATE INDEX "OnboardingToken_staffId_idx" ON "OnboardingToken"("staffId");

-- CreateIndex
CREATE INDEX "OnboardingToken_expiresAt_idx" ON "OnboardingToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OnboardingToken_isUsed_idx" ON "OnboardingToken"("isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthOnboarding_token_key" ON "OAuthOnboarding"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthOnboarding_userId_key" ON "OAuthOnboarding"("userId");

-- CreateIndex
CREATE INDEX "OAuthOnboarding_token_idx" ON "OAuthOnboarding"("token");

-- CreateIndex
CREATE INDEX "OAuthOnboarding_userId_idx" ON "OAuthOnboarding"("userId");

-- CreateIndex
CREATE INDEX "OAuthOnboarding_expiresAt_idx" ON "OAuthOnboarding"("expiresAt");

-- CreateIndex
CREATE INDEX "OAuthOnboarding_isUsed_idx" ON "OAuthOnboarding"("isUsed");

-- CreateIndex
CREATE INDEX "TimeEntry_staffId_idx" ON "TimeEntry"("staffId");

-- CreateIndex
CREATE INDEX "TimeEntry_companyId_idx" ON "TimeEntry"("companyId");

-- CreateIndex
CREATE INDEX "TimeEntry_clockIn_idx" ON "TimeEntry"("clockIn");

-- CreateIndex
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");

-- CreateIndex
CREATE INDEX "TimeEntry_isApproved_idx" ON "TimeEntry"("isApproved");

-- CreateIndex
CREATE INDEX "TimeEntry_payrollEntryId_idx" ON "TimeEntry"("payrollEntryId");

-- CreateIndex
CREATE INDEX "FileFolder_companyId_idx" ON "FileFolder"("companyId");

-- CreateIndex
CREATE INDEX "FileFolder_parentId_idx" ON "FileFolder"("parentId");

-- CreateIndex
CREATE INDEX "FileFolder_type_idx" ON "FileFolder"("type");

-- CreateIndex
CREATE INDEX "FileFolder_ownerId_idx" ON "FileFolder"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FileFolder_companyId_path_key" ON "FileFolder"("companyId", "path");

-- CreateIndex
CREATE INDEX "FileRecord_folderId_idx" ON "FileRecord"("folderId");

-- CreateIndex
CREATE INDEX "FileRecord_uploadedById_idx" ON "FileRecord"("uploadedById");

-- CreateIndex
CREATE INDEX "FileRecord_fileName_idx" ON "FileRecord"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_companyId_key" ON "Ledger"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_stripeAccountId_key" ON "Ledger"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Ledger_companyId_idx" ON "Ledger"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_ledgerId_status_orderedAt_idx" ON "Order"("ledgerId", "status", "orderedAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderedAt_idx" ON "Order"("orderedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerInvoice_invoiceNumber_key" ON "LedgerInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "LedgerInvoice_ledgerId_idx" ON "LedgerInvoice"("ledgerId");

-- CreateIndex
CREATE INDEX "LedgerInvoice_orderId_idx" ON "LedgerInvoice"("orderId");

-- CreateIndex
CREATE INDEX "LedgerInvoice_status_idx" ON "LedgerInvoice"("status");

-- CreateIndex
CREATE INDEX "LedgerInvoice_dueDate_idx" ON "LedgerInvoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollJurisdiction_code_key" ON "PayrollJurisdiction"("code");

-- CreateIndex
CREATE INDEX "PayrollJurisdiction_countryCode_idx" ON "PayrollJurisdiction"("countryCode");

-- CreateIndex
CREATE INDEX "PayrollJurisdiction_code_idx" ON "PayrollJurisdiction"("code");

-- CreateIndex
CREATE INDEX "PayrollEntry_ledgerId_idx" ON "PayrollEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "PayrollEntry_staffId_idx" ON "PayrollEntry"("staffId");

-- CreateIndex
CREATE INDEX "PayrollEntry_periodStart_periodEnd_idx" ON "PayrollEntry"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PayrollEntry_status_idx" ON "PayrollEntry"("status");

-- CreateIndex
CREATE INDEX "PayrollEntry_jurisdictionId_idx" ON "PayrollEntry"("jurisdictionId");

-- CreateIndex
CREATE INDEX "ExpenseEntry_ledgerId_idx" ON "ExpenseEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "ExpenseEntry_staffId_idx" ON "ExpenseEntry"("staffId");

-- CreateIndex
CREATE INDEX "ExpenseEntry_category_idx" ON "ExpenseEntry"("category");

-- CreateIndex
CREATE INDEX "ExpenseEntry_status_idx" ON "ExpenseEntry"("status");

-- CreateIndex
CREATE INDEX "ExpenseEntry_expenseDate_idx" ON "ExpenseEntry"("expenseDate");

-- CreateIndex
CREATE INDEX "AccountingEntry_ledgerId_idx" ON "AccountingEntry"("ledgerId");

-- CreateIndex
CREATE INDEX "AccountingEntry_entryDate_idx" ON "AccountingEntry"("entryDate");

-- CreateIndex
CREATE INDEX "AccountingEntry_accountType_idx" ON "AccountingEntry"("accountType");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPricing_plan_key" ON "PlanPricing"("plan");

-- CreateIndex
CREATE INDEX "PlanPricing_plan_idx" ON "PlanPricing"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoCode_expiresAt_idx" ON "PromoCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_slug_key" ON "Persona"("slug");

-- CreateIndex
CREATE INDEX "CompanyVocabulary_companyId_idx" ON "CompanyVocabulary"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyVocabulary_companyId_key_key" ON "CompanyVocabulary"("companyId", "key");

-- CreateIndex
CREATE INDEX "GeneratedSection_companyId_idx" ON "GeneratedSection"("companyId");

-- CreateIndex
CREATE INDEX "GeneratedSection_pageId_idx" ON "GeneratedSection"("pageId");

-- CreateIndex
CREATE INDEX "GeneratedPageDraft_companyId_idx" ON "GeneratedPageDraft"("companyId");

-- CreateIndex
CREATE INDEX "GeneratedPageDraft_pageId_idx" ON "GeneratedPageDraft"("pageId");

-- CreateIndex
CREATE INDEX "GenerationJob_companyId_idx" ON "GenerationJob"("companyId");

-- CreateIndex
CREATE INDEX "Page_companyId_idx" ON "Page"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_companyId_slug_key" ON "Page"("companyId", "slug");

-- CreateIndex
CREATE INDEX "NavigationItem_companyId_idx" ON "NavigationItem"("companyId");

-- CreateIndex
CREATE INDEX "NavigationItem_pageId_idx" ON "NavigationItem"("pageId");

-- CreateIndex
CREATE INDEX "ServiceSchedule_companyId_idx" ON "ServiceSchedule"("companyId");

-- CreateIndex
CREATE INDEX "Booking_scheduleId_idx" ON "Booking"("scheduleId");

-- CreateIndex
CREATE INDEX "Asset_companyId_idx" ON "Asset"("companyId");

-- CreateIndex
CREATE INDEX "_CompanyToPayrollJurisdiction_B_index" ON "_CompanyToPayrollJurisdiction"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryAddressId_fkey" FOREIGN KEY ("primaryAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyLocationId_fkey" FOREIGN KEY ("companyLocationId") REFERENCES "CompanyLocation"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPaymentProvider" ADD CONSTRAINT "CustomerPaymentProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_primaryAddressId_fkey" FOREIGN KEY ("primaryAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTaxInfo" ADD CONSTRAINT "CompanyTaxInfo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiStorefrontGenerationLog" ADD CONSTRAINT "AiStorefrontGenerationLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiStorefrontGenerationLog" ADD CONSTRAINT "AiStorefrontGenerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Conversation" ADD CONSTRAINT "V4Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Conversation" ADD CONSTRAINT "V4Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Message" ADD CONSTRAINT "V4Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "V4Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Website" ADD CONSTRAINT "V4Website_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Website" ADD CONSTRAINT "V4Website_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "V4Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "V4Website" ADD CONSTRAINT "V4Website_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontPost" ADD CONSTRAINT "StorefrontPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontPost" ADD CONSTRAINT "StorefrontPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportArticle" ADD CONSTRAINT "SupportArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportArticle" ADD CONSTRAINT "SupportArticle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_rootCompanyId_fkey" FOREIGN KEY ("rootCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberCompanyId_fkey" FOREIGN KEY ("subscriberCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyLocation" ADD CONSTRAINT "CompanyLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyLocation" ADD CONSTRAINT "CompanyLocation_primaryAddressId_fkey" FOREIGN KEY ("primaryAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyStaff" ADD CONSTRAINT "CompanyStaff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyStaff" ADD CONSTRAINT "CompanyStaff_payrollJurisdictionId_fkey" FOREIGN KEY ("payrollJurisdictionId") REFERENCES "PayrollJurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyStaff" ADD CONSTRAINT "CompanyStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyOAuthSetting" ADD CONSTRAINT "CompanyOAuthSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyLocationId_fkey" FOREIGN KEY ("companyLocationId") REFERENCES "CompanyLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceImage" ADD CONSTRAINT "ServiceImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontOrder" ADD CONSTRAINT "StorefrontOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontOrder" ADD CONSTRAINT "StorefrontOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontOrderItem" ADD CONSTRAINT "StorefrontOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StorefrontOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontOrderItem" ADD CONSTRAINT "StorefrontOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontOrderItem" ADD CONSTRAINT "StorefrontOrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGateway" ADD CONSTRAINT "PaymentGateway_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaidAccount" ADD CONSTRAINT "PlaidAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_fileRecordId_fkey" FOREIGN KEY ("fileRecordId") REFERENCES "FileRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StorefrontOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedLoginAttempt" ADD CONSTRAINT "FailedLoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpBlacklist" ADD CONSTRAINT "IpBlacklist_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGenerationLog" ADD CONSTRAINT "VideoGenerationLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VideoGenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontConversation" ADD CONSTRAINT "StorefrontConversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontMessage" ADD CONSTRAINT "StorefrontMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "StorefrontConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontMessage" ADD CONSTRAINT "StorefrontMessage_specVersionId_fkey" FOREIGN KEY ("specVersionId") REFERENCES "StorefrontSpecVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontSpecVersion" ADD CONSTRAINT "StorefrontSpecVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryEvent" ADD CONSTRAINT "TelemetryEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "WebhookConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorefrontWebsiteV3" ADD CONSTRAINT "StorefrontWebsiteV3_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmailProvider" ADD CONSTRAINT "UserEmailProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyHederaSetting" ADD CONSTRAINT "CompanyHederaSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_subscriberCompanyId_fkey" FOREIGN KEY ("subscriberCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFinancialEntry" ADD CONSTRAINT "ProjectFinancialEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFinancialEntry" ADD CONSTRAINT "ProjectFinancialEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentDocument" ADD CONSTRAINT "EmploymentDocument_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingToken" ADD CONSTRAINT "OnboardingToken_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthOnboarding" ADD CONSTRAINT "OAuthOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileFolder" ADD CONSTRAINT "FileFolder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileFolder" ADD CONSTRAINT "FileFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FileFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerInvoice" ADD CONSTRAINT "LedgerInvoice_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerInvoice" ADD CONSTRAINT "LedgerInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "PayrollJurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CompanyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToPayrollJurisdiction" ADD CONSTRAINT "_CompanyToPayrollJurisdiction_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToPayrollJurisdiction" ADD CONSTRAINT "_CompanyToPayrollJurisdiction_B_fkey" FOREIGN KEY ("B") REFERENCES "PayrollJurisdiction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
