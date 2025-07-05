import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: {
      "import/resolver": {
        alias: {
          map: [
            ["@", "./app/src"],
            ["@/utils", "./app/src/utils"],
            ["@/lib", "./app/src/lib"],
            ["@/components", "./app/src/components"],
            ["@/scripts", "./app/scripts"],
            ["@/cli", "./cli"]
          ],
          extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
      },
    },
  },
];

export default eslintConfig;
