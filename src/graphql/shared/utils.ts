import { Event } from '@prisma/client';

export function formatTransaction(trxn: Event) {
  return {
    hash: trxn.transactionHash,
    blockNumber: trxn.blockNumber,
    timestamp: trxn.timestamp,
    transactionType: trxn.eventType,
    token: { id: trxn.tokenId },
  };
}
