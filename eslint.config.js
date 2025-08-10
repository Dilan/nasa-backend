const eslint = require("@eslint/js");
const jest = require("eslint-plugin-jest");
const globals = require("globals");

const tseslint = require("typescript-eslint");

const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [
      "**/.eslintrc.js",
      "**/eslint.config.mjs",
      "**/eslint.config.cjs",
      "**/eslint.config.js",
      "**/*.spec.ts",
      "src/seed.messages.ts",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },

      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    // Rules
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-for-of": "off",
    },
  },

  {
    // jest
    languageOptions: {
      globals: { ...globals.jest },
    },
    files: ["test/*.test.js", "test/*.ts"],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,
    },
  },

];