import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * ESLint configuration for the AIDE Control app
 * Following the project coding standards defined in CODING_STANDARDS.md
 */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Temporarily disable react-hooks/rules-of-hooks due to ESLint v9 compatibility issue
      "react-hooks/rules-of-hooks": "off",

      // Enforce code style from coding standards
      "indent": ["error", "tab"],
      "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],
      "jsx-quotes": ["error", "prefer-double"],

      // Naming conventions
      "camelcase": ["error", { "properties": "always" }],
      "@typescript-eslint/naming-convention": [
        "error",
        // Type definitions use PascalCase
        { "selector": "interface", "format": ["PascalCase"] },
        { "selector": "typeAlias", "format": ["PascalCase"] },
        // Enum values use PascalCase
        { "selector": "enumMember", "format": ["PascalCase"] },
        // Functions and methods use camelCase
        { "selector": "function", "format": ["camelCase"] },
        { "selector": "method", "format": ["camelCase"] },
        // Properties and local variables use camelCase
        { "selector": "property", "format": ["camelCase"], "leadingUnderscore": "allow" },
        { "selector": "variable", "format": ["camelCase", "UPPER_CASE"], "leadingUnderscore": "allow" },
        // Constants use UPPER_CASE
        {
          "selector": "variable",
          "modifiers": ["const"],
          "format": ["camelCase", "UPPER_CASE", "PascalCase"]
        }
      ],

      // Require JSDoc comments for functions, classes, etc.
      "jsdoc/require-jsdoc": ["warn", {
        "publicOnly": true,
        "require": {
          "FunctionDeclaration": true,
          "MethodDefinition": true,
          "ClassDeclaration": true,
          "ArrowFunctionExpression": false
        }
      }],

      // Enforce arrow function style
      "arrow-body-style": ["error", "as-needed"],

      // Curly braces required for all blocks
      "curly": ["error", "all"],

      // Enforce brace style
      "brace-style": ["error", "1tbs"],

      // No explicit any types
      "@typescript-eslint/no-explicit-any": "warn",

      // Enforce consistent error handling
      "no-throw-literal": "error"
    }
  }
];

export default eslintConfig;
