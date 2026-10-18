import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { unavailable } from "@/lib/domain/providers";
import { loadTokenFromProviders } from "@/lib/server/provider-adapters";

const redisUrl = process.env.REDIS_URL;
const queueName = "grok-sniper";

async function start() {
  if (!redisUrl) {
    console.warn(JSON.stringify({ event: "worker_start", state: "DEGRADED", detail: "REDIS_URL is not configured; worker will not fabricate a live scan." }));
    return;
  }
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
  await connection.connect();
  const queue = new Queue(queueName, { connection });
  await queue.add("discovery.scan", { reason: "worker_boot" }, { jobId: "boot-scan", removeOnComplete: 100, removeOnFail: 100 });
  const worker = new Worker(queueName, async (job) => {
    const mint = typeof job.data?.mint === "string" ? job.data.mint : undefined;
    if (mint) {
      const token = await loadTokenFromProviders(mint);
      console.log(JSON.stringify({ event: "job_processed", jobId: job.id, name: job.name, providerState: token.dataState, mint: token.mint, eligibility: token.eligibility }));
      return token;
    }
    const provider = unavailable("worker-provider", "A mint was not supplied; continuous discovery needs a configured event stream");
    console.log(JSON.stringify({ event: "job_processed", jobId: job.id, name: job.name, providerState: provider.state, detail: provider.detail }));
    return { state: "UNAVAILABLE", provenance: provider.provenance };
  }, { connection, concurrency: 1 });
  worker.on("completed", (job) => console.log(JSON.stringify({ event: "job_completed", jobId: job.id })));
  worker.on("failed", (job, error) => console.error(JSON.stringify({ event: "job_failed", jobId: job?.id, error: error.message })));
  console.log(JSON.stringify({ event: "worker_ready", queue: queueName, mode: process.env.NEXT_PUBLIC_APP_MODE ?? "PAPER" }));
}

void start().catch((error) => { console.error(JSON.stringify({ event: "worker_fatal", error: error instanceof Error ? error.message : "unknown" })); process.exitCode = 1; });
