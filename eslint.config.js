import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import js from "@eslint/js";
import globals from "globals";

export default [
  // Any other config imports go at the top
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        myCustomGlobal: "readonly",
      },
    },
  },
  {
    rules: {
      // indent: ["error", 2],
      // "no-unused-vars": "warn",
      // "no-undef": 0,
    },
  },
  eslintPluginPrettierRecommended,
];
