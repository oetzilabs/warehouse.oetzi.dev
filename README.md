# warehouse.oetzi.dev

**Private monorepo for oetzilabs' warehouse platform**  
> *Built with TypeScript, SST, Effect, AWS SDK, and more.*

---

## Overview

This repository contains the source code for the `warehouse.oetzi.dev` project, a modular warehouse management platform built by oetzilabs.  
It employs a modern TypeScript monorepo architecture, leveraging SST for serverless infrastructure, Effect for functional programming, and deep AWS integration.

---

## Monorepo Structure

- **packages/core**: Core library, business logic, and shared utilities.
- **packages/functions**: Cloud/serverless API functions (AWS Lambda, etc).
- **packages/web**: (presumed) Frontend application (see scripts).
- Additional packages may be added under `packages/*`.

---

## Main Technologies

- **TypeScript**
- **SST (Serverless Stack)**
- **Effect**
- **AWS SDK** (S3, SNS, SES, Textract, IoT, EventBridge, etc)
- **Drizzle ORM & Valibot** (data modeling/validation)
- **Hono** (API framework)
- **Solid.js** (frontend, if present)
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
```

- To run the web app locally:
    ```bash
    cd packages/web
    bun run dev
    ```

### Build & Deploy

```bash
bun run build            # Build all packages
bun run deploy           # Deploy to AWS
```

---

## Scripts

Common scripts (from root):

- `dev`          – Start SST dev environment
- `local:dev`    – Start web frontend locally
- `build`        – Build all packages
- `deploy`       – Deploy to AWS
- `remove`       – Remove stack from AWS
- `console`      – SST console
- `typecheck`    – TypeScript check
- `clean`        – Remove build/node_modules artifacts

See each `package.json` for more.

---

## Project Philosophy

- **Functional, type-safe code** via Effect, Valibot, and TypeScript
- **Serverless-first** with AWS and SST
- **Monorepo** for cohesive development
- **Extensible** with workspaces and modular packages

---

## License

*This repository is private and does not specify a license.*

---

## About

- **Maintainer:** [oetzilabs](https://github.com/oetzilabs)
- **Repository:** [warehouse.oetzi.dev](https://github.com/oetzilabs/warehouse.oetzi.dev)

---