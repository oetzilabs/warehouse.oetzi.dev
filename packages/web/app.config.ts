import path from "node:path";
import { defineConfig } from "@solidjs/start/config";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;

const withSST: Parameters<typeof defineConfig>[0]["server"] = Object.keys(process.env).some((k) => k.startsWith("SST"))
  ? { preset: "aws-lambda", awsLambda: { streaming: true } }
  : {
      preset: "bun",
    };

export default defineConfig({
  extensions: ["mdx", "md", "tsx", "ts"],
  server: {
    ...withSST,
    esbuild: {
      options: {
        target: "ESNext",
      },
    },
  },
  vite: {
    ssr: { noExternal: ["@kobalte/core"] },
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "src"),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "ESNext",
        treeShaking: true,
        supported: {
          bigint: true,
        },
      },
    },
    build: {
      target: "ESNext",
    },
    // server: {
    //   cors: false,
    // },
    plugins: [
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
      }),
    ],
  },
});
