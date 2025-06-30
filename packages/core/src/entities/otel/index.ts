import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

export const createOtelLayer = (serviceName: string, url: string = "http://localhost:4318/v1/traces") =>
  NodeSdk.layer(() => ({
    resource: { serviceName },
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url,
      }),
    ),
  }));
