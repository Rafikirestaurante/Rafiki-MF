import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules", "supabase/functions"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser }
    },
    rules: {
      "no-unused-vars": "off"
    }
  },
  {
    files: ["scripts/**/*.mjs", "*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node }
    }
  }
];
