# @warehouseoetzidev/printer

A modular printer service that processes print jobs through a plugin-based architecture using Effect for functional programming.

## Architecture

The service is built around a plugin system where different print job sources can be plugged into a core printing engine:

- **Core Program** (`src/program-4.ts`): Plugin-based print job processor
- **Bun Target** (`src/target/bun.ts`): MQTT-based print job source implementation
- **Printer Service**: USB ESC/POS printer management
- **MQTT Service**: Real-time message handling

## Core Components

### Program 4 - Plugin Architecture (`src/program-4.ts`)

The main printing program that accepts plugins providing print job streams:

```typescript
// Plugin interface
interface PrinterConsumerPlugin {
  stream: Stream.Stream<PrintJob, never, never>;
}

// Queue-based plugin for buffering print jobs
export const Queuer = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<PrintJob>();
  const stream = Stream.fromQueue(queue);
  const enqueue = (job: PrintJob) => Queue.offer(queue, job);
  return { stream, enqueue };
});

// Main program with plugin
export const main = (plugin: PrinterConsumerPlugin) =>
  Effect.gen(function* () {
    yield* program(plugin.stream);
  }).pipe(Effect.provide([PrinterLive]));
```

### Bun Target - MQTT Integration (`src/target/bun.ts`)

Implementation that connects to MQTT broker and transforms messages into print jobs:

- Connects to MQTT broker using configuration
- Subscribes to printer-specific channels via Realtime service
- Filters messages for print events (`type: "print"`, `action: "created"`)
- Enqueues print jobs to the queue plugin
- Runs the main printing program with the queue stream

## Features

- **Plugin Architecture**: Extensible print job sources
- **Queue-based Processing**: Buffered print job handling
- **MQTT Integration**: Real-time print job reception
- **USB Printer Support**: ESC/POS compatible printers
- **Effect-based**: Functional programming with proper resource management
- **Configurable**: Environment-based configuration

## Environment Variables

- `ORG_ID`: Organization identifier
- `BROKER_URL`: MQTT broker URL
- `PREFIX`: MQTT topic prefix
- `CLIENT_ID`: MQTT client identifier

## Usage

### Installation

This package is part of a monorepo. Install dependencies with:

```bash
bun install
```

### Running

Start the service:

```bash
# With Bun
bun run start

# With Node.js
npm run start:node
```

### Testing

Run tests:

```bash
bun test
```

### Type Checking

```bash
npm run typecheck
```

## Services

### MQTT Service (`src/services/mqtt-3/index.ts`)

Handles MQTT connections, publishing, subscribing, and disconnecting with proper resource management.

### Printer Service (`src/services/printer/index.ts`)

Manages USB printer connections and printing operations using ESC/POS protocol.

### Realtime Service (`@warehouseoetzidev/core`)

Provides channel subscription management for real-time message handling.

## Configuration

Configuration is loaded from environment variables using Effect's Config system with redacted values for sensitive data.

## Dependencies

- `@node-escpos/core`: ESC/POS printer commands
- `mqtt`: MQTT client
- `@warehouseoetzidev/core`: Shared core utilities and Realtime service
- `@effect/platform-node`: Effect platform runtime for Node.js
