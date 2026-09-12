import eslint from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: ["coverage/**", "node_modules/**", "src/generated/**"],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...eslint.configs.recommended.rules,
      "no-console": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
]
