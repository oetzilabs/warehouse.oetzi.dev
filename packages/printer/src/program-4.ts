import { Effect, Queue, Stream } from "effect";
import { PrintJob } from "./schemas";
import { PrinterLive, PrinterService } from "./services/printer";

const program = (jobStream: Stream.Stream<PrintJob, never, never>) =>
  Effect.gen(function* () {
    const printerSvc = yield* PrinterService;
    yield* Stream.runForEach(jobStream, (job) =>
      Effect.scoped(
        Effect.gen(function* () {
          const device = yield* printerSvc.device();
          yield* printerSvc.print(device, job);
        }),
      ),
    );
  });

// Plugin interface for print job consumers
export interface PrinterConsumerPlugin {
  stream: Stream.Stream<PrintJob, never, never>;
}

// Plugin: Queue-based stream for print jobs
export const Queuer = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<PrintJob>();
  const stream = Stream.fromQueue(queue);
  const enqueue = (job: PrintJob) => Queue.offer(queue, job);
  return { stream, enqueue };
});

// Main program accepting a consumer plugin
export const main = (plugin: PrinterConsumerPlugin) =>
  Effect.gen(function* () {
    yield* program(plugin.stream);
  }).pipe(Effect.provide([PrinterLive]));
