import path from "node:path";
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;

export default defineConfig({
  extensions: ["mdx", "md", "tsx", "ts"],
  server: {
    preset: "aws-lambda",
    awsLambda: {
      streaming: true,
    },
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
      tailwindcss(),
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
      }),
    ],
  },
});
