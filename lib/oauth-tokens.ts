import { db } from "@/lib/db";

/**
 * Refresh an expired OAuth access token using the refresh token
 * @param userId - The user ID
 * @param provider - The OAuth provider (google, microsoft, etc.)
 * @returns The new access token or null if refresh failed
 */
export async function refreshOAuthToken(
  userId: string,
  provider: string
): Promise<string | null> {
  try {
    // Get the account with refresh token
    const account = await db.account.findFirst({
      where: {
        userId,
        provider,
        refresh_token: { not: null },
      },
    });

    if (!account || !account.refresh_token) {
      console.error(
        `No refresh token found for user ${userId} and provider ${provider}`
      );
      return null;
    }

    // Get OAuth provider settings
    const oauthSettings = await db.oAuthProviderSetting.findUnique({
      where: { provider },
    });

    if (
      !oauthSettings ||
      !oauthSettings.clientId ||
      !oauthSettings.clientSecret
    ) {
      console.error(`OAuth settings not configured for provider ${provider}`);
      return null;
    }

    let tokenUrl: string;
    let requestBody: Record<string, string>;

    // Provider-specific token refresh endpoints
    switch (provider) {
      case "google":
        tokenUrl = "https://oauth2.googleapis.com/token";
        requestBody = {
          client_id: oauthSettings.clientId,
          client_secret: oauthSettings.clientSecret,
          refresh_token: account.refresh_token,
          grant_type: "refresh_token",
        };
        break;

      case "microsoft":
        tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        requestBody = {
          client_id: oauthSettings.clientId,
          client_secret: oauthSettings.clientSecret,
          refresh_token: account.refresh_token,
          grant_type: "refresh_token",
          scope: "openid email profile User.Read",
        };
        break;

      case "github":
        tokenUrl = "https://github.com/login/oauth/access_token";
        requestBody = {
          client_id: oauthSettings.clientId,
          client_secret: oauthSettings.clientSecret,
          refresh_token: account.refresh_token,
          grant_type: "refresh_token",
        };
        break;

      default:
        console.error(
          `Token refresh not implemented for provider: ${provider}`
        );
        return null;
    }

    // Request new access token
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token refresh failed for ${provider}:`, errorText);
      return null;
    }

    const tokenData = await response.json();

    // Update the account with new tokens
    await db.account.update({
      where: {
        id: account.id,
      },
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || account.refresh_token, // Some providers don't return new refresh token
        expires_at: tokenData.expires_in
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in
          : null,
      },
    });

    return tokenData.access_token;
  } catch (error) {
    console.error(`Error refreshing OAuth token for ${provider}:`, error);
    return null;
  }
}

/**
 * Get a valid OAuth access token for a user and provider
 * Automatically refreshes if expired
 * @param userId - The user ID
 * @param provider - The OAuth provider
 * @returns Valid access token or null
 */
export async function getValidOAuthToken(
  userId: string,
  provider: string
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider,
    },
  });

  if (!account || !account.access_token) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  const bufferSeconds = 5 * 60; // 5 minutes

  if (account.expires_at && account.expires_at < now + bufferSeconds) {
    // Token is expired or about to expire, refresh it
    return await refreshOAuthToken(userId, provider);
  }

  return account.access_token;
}

/**
 * Get all OAuth accounts for a user
 * @param userId - The user ID
 * @returns Array of connected OAuth providers
 */
export async function getUserOAuthAccounts(userId: string) {
  return await db.account.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      type: true,
      scope: true,
    },
  });
}

/**
 * Disconnect an OAuth account
 * @param userId - The user ID
 * @param provider - The provider to disconnect
 * @returns true if successful
 */
export async function disconnectOAuthAccount(
  userId: string,
  provider: string
): Promise<boolean> {
  try {
    // Check if user has other authentication methods
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
        authMethod: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Prevent disconnecting last authentication method
    if (user._count.accounts === 1 && !user.password) {
      throw new Error(
        "Cannot disconnect last authentication method. Please add a password first."
      );
    }

    await db.account.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    // Update user's authMethod if needed
    if (user._count.accounts === 1 && user.password) {
      // This is their last OAuth account and they have a password
      await db.user.update({
        where: { id: userId },
        data: { authMethod: "credentials" },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error disconnecting OAuth account:`, error);
    return false;
  }
}
