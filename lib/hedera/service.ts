import { db } from "@/lib/db";
import Decimal from "decimal.js";
import { decrypt } from "@/lib/encryption";
import {
  canAffordTransaction,
  recordTransactionCost,
  updateAccountBalance,
} from "./cost-manager";

async function getClient(network: string | null = null) {
  const { Client } = await import("@hashgraph/sdk");
  switch (network) {
    case "PREVIEWNET":
      return Client.forPreviewnet();
    case "MAINNET":
      return Client.forMainnet();
    case "TESTNET":
    default:
      return Client.forTestnet();
  }
}

/**
 * Get Hedera credentials from database (encrypted storage)
 * Falls back to env vars for backward compatibility
 */
async function getHederaCredentials(): Promise<{
  accountId: string;
  privateKey: string;
  network: string;
}> {
  const setting = await db.hederaSetting.findFirst({
    where: { scope: "GLOBAL", isActive: true },
  });

  // Try to use encrypted credentials from database first (prefer HEX, then DER)
  if (
    setting?.hederaAccount &&
    (setting?.hederaHexKey || setting?.hederaDerKey)
  ) {
    try {
      const accountId = decrypt(setting.hederaAccount);
      const privateKey = setting.hederaHexKey
        ? decrypt(setting.hederaHexKey)
        : decrypt(setting.hederaDerKey!);

      if (accountId && privateKey) {
        return {
          accountId,
          privateKey,
          network: setting.network || "TESTNET",
        };
      }
    } catch (error) {
      console.error(
        "Failed to decrypt Hedera credentials from database:",
        error
      );
      // Fall through to env vars
    }
  }

  // Fallback to environment variables
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error(
      "Hedera credentials not configured. Please configure via admin settings or environment variables."
    );
  }

  return {
    accountId,
    privateKey,
    network: "TESTNET",
  };
}

export async function createTopic(
  network: string | null = null,
  memo?: string | null
) {
  const credentials = await getHederaCredentials();
  const client = await getClient(network || credentials.network);
  client.setOperator(credentials.accountId, credentials.privateKey);

  const { TopicCreateTransaction } = await import("@hashgraph/sdk");
  const tx = new TopicCreateTransaction();
  if (memo) tx.setTopicMemo(memo);
  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  return receipt.topicId?.toString() || null;
}

export async function submitMessage(
  topicId: string,
  message: string,
  network: string | null = null,
  companyId?: string
): Promise<{
  transactionId: string | null;
  consensusTimestamp: string | null;
  cost?: Decimal;
}> {
  // Cost check before transaction
  const costCheck = await canAffordTransaction(companyId);
  if (!costCheck.canProceed) {
    throw new Error(`Transaction blocked: ${costCheck.reason}`);
  }

  const credentials = await getHederaCredentials();
  const client = await getClient(network || credentials.network);
  client.setOperator(credentials.accountId, credentials.privateKey);

  const { TopicMessageSubmitTransaction, AccountBalanceQuery } = await import(
    "@hashgraph/sdk"
  );
  const tx = new TopicMessageSubmitTransaction({ topicId, message });
  const resp = await tx.execute(client);
  const record = await resp.getRecord(client);

  // Get updated balance
  const balanceQuery = new AccountBalanceQuery().setAccountId(
    credentials.accountId
  );
  const balance = await balanceQuery.execute(client);
  const balanceHbar = new Decimal(balance.hbars.toString());

  // Update balance in database
  await updateAccountBalance(balanceHbar);

  const result = {
    transactionId: resp.transactionId?.toString() ?? null,
    consensusTimestamp: record?.consensusTimestamp?.toString?.() ?? null,
    cost: costCheck.estimatedCost,
  };

  // Record transaction cost
  await recordTransactionCost({
    companyId,
    hash: message,
    topicId,
    transactionId: result.transactionId ?? undefined,
    consensusTimestamp: result.consensusTimestamp
      ? new Date(result.consensusTimestamp)
      : undefined,
    costHbar: result.cost,
    balanceAfter: balanceHbar,
  });

  return result;
}

// Convenience wrapper that uses DB-stored HederaSetting when available
export async function anchorHashToHedera(hash: string, companyId?: string) {
  const setting = await db.hederaSetting.findFirst({
    where: { scope: "GLOBAL", isActive: true },
  });

  if (!setting) {
    throw new Error("Hedera is not configured or active");
  }

  const topicId = setting.topicId || process.env.HEDERA_TOPIC_ID;

  if (!topicId) {
    throw new Error("No Hedera topic configured");
  }

  return submitMessage(topicId, hash, setting.network, companyId);
}
