import { db } from "@/lib/db";

/**
 * Account Tracking Service
 * Tracks how users login (credentials, Google, GitHub, etc.)
 * Maintains history of login methods used
 */

export type LoginProvider =
  | "credentials"
  | "google"
  | "github"
  | "azure"
  | "facebook"
  | "apple"
  | string;

export interface AccountInfo {
  id: string;
  provider: LoginProvider;
  isPrimary: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  timesUsed: number;
  email?: string | null;
  displayName?: string | null;
  linkedAt: Date;
}

/**
 * Create or update an account record when user logs in
 */
export async function trackLoginMethod(
  userId: string,
  provider: LoginProvider,
  providerAccountId: string,
  metadata?: {
    email?: string;
    displayName?: string;
    profileUrl?: string;
    avatarUrl?: string;
    refresh_token?: string;
    access_token?: string;
    expires_at?: number;
    id_token?: string;
  }
) {
  // Check if this is the user's first account (make it primary)
  const existingAccounts = await db.account.count({
    where: { userId },
  });

  const isPrimary = existingAccounts === 0;

  // Upsert the account record
  const account = await db.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      lastUsedAt: new Date(),
      timesUsed: { increment: 1 },
      email: metadata?.email,
      displayName: metadata?.displayName,
      profileUrl: metadata?.profileUrl,
      avatarUrl: metadata?.avatarUrl,
      refresh_token: metadata?.refresh_token,
      access_token: metadata?.access_token,
      expires_at: metadata?.expires_at,
      id_token: metadata?.id_token,
    },
    create: {
      userId,
      type: provider === "credentials" ? "credentials" : "oauth",
      provider,
      providerAccountId,
      isPrimary,
      isActive: true,
      lastUsedAt: new Date(),
      timesUsed: 1,
      email: metadata?.email,
      displayName: metadata?.displayName,
      profileUrl: metadata?.profileUrl,
      avatarUrl: metadata?.avatarUrl,
      refresh_token: metadata?.refresh_token,
      access_token: metadata?.access_token,
      expires_at: metadata?.expires_at,
      id_token: metadata?.id_token,
      linkedAt: new Date(),
    },
  });

  return account;
}

/**
 * Get all login methods for a user
 */
export async function getUserLoginMethods(
  userId: string
): Promise<AccountInfo[]> {
  const accounts = await db.account.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { lastUsedAt: "desc" }],
    select: {
      id: true,
      provider: true,
      isPrimary: true,
      isActive: true,
      lastUsedAt: true,
      timesUsed: true,
      email: true,
      displayName: true,
      linkedAt: true,
    },
  });

  return accounts;
}

/**
 * Get the primary login method for a user
 */
export async function getPrimaryLoginMethod(userId: string) {
  return await db.account.findFirst({
    where: {
      userId,
      isPrimary: true,
    },
  });
}

/**
 * Set a login method as primary
 */
export async function setPrimaryLoginMethod(userId: string, accountId: string) {
  // Remove primary flag from all accounts
  await db.account.updateMany({
    where: { userId },
    data: { isPrimary: false },
  });

  // Set new primary
  await db.account.update({
    where: { id: accountId },
    data: { isPrimary: true },
  });
}

/**
 * Disable a login method (user can't login with it anymore)
 */
export async function disableLoginMethod(accountId: string) {
  await db.account.update({
    where: { id: accountId },
    data: { isActive: false },
  });
}

/**
 * Enable a login method
 */
export async function enableLoginMethod(accountId: string) {
  await db.account.update({
    where: { id: accountId },
    data: { isActive: true },
  });
}

/**
 * Link a new OAuth provider to existing user
 */
export async function linkOAuthProvider(
  userId: string,
  provider: LoginProvider,
  providerAccountId: string,
  oauthData: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    id_token?: string;
    email?: string;
    displayName?: string;
    profileUrl?: string;
    avatarUrl?: string;
  }
) {
  return await trackLoginMethod(userId, provider, providerAccountId, oauthData);
}

/**
 * Unlink an OAuth provider (keeps record but deactivates it)
 */
export async function unlinkOAuthProvider(accountId: string) {
  // Don't delete, just deactivate
  await db.account.update({
    where: { id: accountId },
    data: {
      isActive: false,
      refresh_token: null,
      access_token: null,
      id_token: null,
    },
  });
}

/**
 * Get login statistics for a user
 */
export async function getUserLoginStats(userId: string) {
  const accounts = await db.account.findMany({
    where: { userId },
    select: {
      provider: true,
      timesUsed: true,
      lastUsedAt: true,
      isActive: true,
    },
  });

  const totalLogins = accounts.reduce((sum, acc) => sum + acc.timesUsed, 0);
  const activeProviders = accounts.filter((acc) => acc.isActive).length;
  const mostUsedProvider = accounts.reduce(
    (max, acc) => (acc.timesUsed > max.timesUsed ? acc : max),
    accounts[0]
  );

  return {
    totalLogins,
    activeProviders,
    totalProviders: accounts.length,
    mostUsedProvider: mostUsedProvider?.provider,
    providers: accounts,
  };
}

/**
 * Check if user can login with a specific provider
 */
export async function canLoginWith(
  userId: string,
  provider: LoginProvider
): Promise<boolean> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider,
      isActive: true,
    },
  });

  return !!account;
}

/**
 * Get user's login history (most recent login method)
 */
export async function getRecentLoginMethod(userId: string) {
  return await db.account.findFirst({
    where: { userId },
    orderBy: { lastUsedAt: "desc" },
  });
}
