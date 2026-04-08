import { createPinoLogger } from "@agenticverdict/observability";

type WorkerLogger = ReturnType<typeof createPinoLogger>;

let root: WorkerLogger | undefined;

export function getWorkerRootLogger(): WorkerLogger {
  if (!root) {
    root = createPinoLogger("worker");
  }
  return root;
}

export function createJobLogger(queueName: string, jobId: string): WorkerLogger {
  return getWorkerRootLogger().child({ queue: queueName, jobId });
}
