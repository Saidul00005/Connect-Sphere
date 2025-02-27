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
    rules: {
      // Disable warnings for explicit 'any'
      "@typescript-eslint/no-explicit-any": "off",
      // Disable warnings for unused variables
      "@typescript-eslint/no-unused-vars": "off",
      // Disable warnings for missing dependencies in React hooks
      "react-hooks/exhaustive-deps": "off",
      // Disable warnings for unescaped entities in JSX
      "react/no-unescaped-entities": "off",
      // Disable the unused expressions rule
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];

export default eslintConfig;
