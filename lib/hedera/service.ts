import { db } from "@/lib/db";

async function getClient(useTestnet = true) {
  const { Client } = await import("@hashgraph/sdk");
  if (useTestnet) return Client.forTestnet();
  return Client.forMainnet();
}

export async function createTopic(testnet = true) {
  const client = await getClient(testnet);
  if (process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY) {
    client.setOperator(
      process.env.HEDERA_ACCOUNT_ID,
      process.env.HEDERA_PRIVATE_KEY
    );
  }

  const { TopicCreateTransaction } = await import("@hashgraph/sdk");
  const tx = new TopicCreateTransaction();
  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  return receipt.topicId?.toString() || null;
}

export async function submitMessage(
  topicId: string,
  message: string,
  testnet = true
): Promise<{
  transactionId: string | null;
  consensusTimestamp: string | null;
}> {
  const client = await getClient(testnet);
  if (process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY) {
    client.setOperator(
      process.env.HEDERA_ACCOUNT_ID,
      process.env.HEDERA_PRIVATE_KEY
    );
  }

  const { TopicMessageSubmitTransaction } = await import("@hashgraph/sdk");
  const tx = new TopicMessageSubmitTransaction({ topicId, message });
  const resp = await tx.execute(client);
  // Use TransactionRecord to get typed consensusTimestamp
  const record = await resp.getRecord(client);
  return {
    transactionId: resp.transactionId?.toString() ?? null,
    consensusTimestamp: record?.consensusTimestamp?.toString?.() ?? null,
  };
}

// Convenience wrapper that uses DB-stored HederaSetting when available
export async function anchorHashToHedera(hash: string) {
  const setting = await db.hederaSetting.findFirst();
  const useTestnet = setting?.useTestnet ?? true;
  const topicId = setting?.topicId || process.env.HEDERA_TOPIC_ID;

  if (!topicId) {
    throw new Error("No Hedera topic configured");
  }

  return submitMessage(topicId, hash, useTestnet);
}
