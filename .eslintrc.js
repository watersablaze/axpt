module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: [
    '.next/', 'node_modules/', 'dist/', '*.config.js', '*.config.cjs', '*.config.mjs'
  ],
  overrides: [
    {
      // ✅ React + Next.js for frontend files only
      files: ['app/src/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'next/core-web-vitals',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        '@next/next/no-duplicate-head': 'error',
        // add more react-specific rules here if needed
      },
    },
    {
      // ❌ Disable React/Next rules in API or CLI or scripts
      files: ['app/api/**/*.ts', 'cli/**/*.ts', 'scripts/**/*.ts'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
        '@next/next/no-duplicate-head': 'off',
      },
    },
  ],
};