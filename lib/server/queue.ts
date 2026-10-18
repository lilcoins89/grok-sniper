import { Queue } from "bullmq";
import IORedis from "ioredis";

export const queueName = "grok-sniper";

export function createQueue() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const connection = new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: true });
  return { connection, queue: new Queue(queueName, { connection }) };
}

export type GrokJobName = "discovery.scan" | "agent.run" | "position.mark" | "transaction.observe";
