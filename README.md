# warehouse.oetzi.dev

**Private monorepo for oetzilabs' warehouse platform**

> _Built with TypeScript, SST, Effect, AWS SDK, and more._

---

## Overview

This repository contains the source code for the `warehouse.oetzi.dev` project, a modular warehouse management platform built by oetzilabs.  
It employs a modern TypeScript monorepo architecture, leveraging SST for serverless infrastructure, Effect for functional programming, and deep AWS integration.

---

## Monorepo Structure

- **packages/core**: Core library, business logic, and shared utilities.
- **packages/functions**: Cloud/serverless API functions (AWS Lambda, etc).
- **packages/web**: Frontend application built with Vinxi and SolidStart.
- **packages/cli**: Command-line interface for warehouse operations.
- **packages/device**: Device management and communication.
- **packages/printer**: Label and barcode printing functionality.
- **packages/realtime**: Real-time communication and MQTT services.
- **packages/docker**: PostgreSQL configuration and Docker setup.

---

## Main Technologies

- **TypeScript**
- **SST (Serverless Stack)**
- **Effect**
- **AWS SDK** (S3, SNS, SES, Textract, IoT, EventBridge, etc)
- **Drizzle ORM & Valibot** (data modeling/validation)
- **Hono** (API framework)
- **Vinxi & SolidStart** (frontend framework)
- **Solid.js** (UI framework)
- **MQTT** (real-time messaging)
- **Vitest** (testing)
- **Bun** (monorepo & dev tooling)
- **OpenTelemetry** (observability)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (for all dev and scripts)
- Node.js (recommended: v18+)
- AWS credentials (for deployment/testing)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev              # Start SST dev environment (full stack)
bun run local:dev        # Start web frontend locally with Vinxi
```

- To run individual packages locally:
  ```bash
  cd packages/web && bun run dev     # Frontend (Vinxi dev server)
  cd packages/cli && bun run dev     # CLI tools
  cd packages/printer && bun run dev # Printer examples
  ```

### Build & Deploy

```bash
bun run build            # Build all packages
bun run deploy           # Deploy to AWS
```

---

## Scripts

Common scripts (from root):

- `dev` – Start SST dev environment
- `local:dev` – Start web frontend locally
- `build` – Build all packages
- `deploy` – Deploy to AWS
- `remove` – Remove stack from AWS
- `console` – SST console
- `typecheck` – TypeScript check
- `clean` – Remove build/node_modules artifacts

See each `package.json` for more.

---

## Project Philosophy

- **Functional, type-safe code** via Effect, Valibot, and TypeScript
- **Serverless-first** with AWS and SST
- **Real-time capabilities** with MQTT and WebSocket connections
- **Modular architecture** with specialized packages for different concerns
- **Device integration** for warehouse hardware (printers, scanners)
- **Monorepo** for cohesive development and shared dependencies

---

## License

_This repository is private and does not specify a license._

---

## About

- **Maintainer:** [oetzilabs](https://github.com/oetzilabs)
- **Repository:** [warehouse.oetzi.dev](https://github.com/oetzilabs/warehouse.oetzi.dev)

---
