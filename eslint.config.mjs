import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/domain',
                '@/features/*/domain/*',
                '@/features/*/application',
                '@/features/*/application/*',
                '@/features/*/infrastructure',
                '@/features/*/infrastructure/*',
                '@/features/*/presentation',
                '@/features/*/presentation/*',
                '@/features/*/schemas',
              ],
              message:
                'Dilarang mengimpor folder internal fitur secara langsung. Gunakan Public API di @/features/<nama-fitur>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/db/schema.ts', 'src/shared/db/seed.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message:
                'Layer shared dilarang mengimpor dari features atau app (arah wajib: app -> features -> shared).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/*',
                '@/features/*/domain',
                '@/features/*/domain/*',
                '@/features/*/application',
                '@/features/*/application/*',
                '@/features/*/infrastructure',
                '@/features/*/infrastructure/*',
                '@/features/*/presentation',
                '@/features/*/presentation/*',
                '@/features/*/schemas',
              ],
              message:
                'Fitur dilarang mengimpor dari app atau folder internal fitur lain. Gunakan @/features/<nama-fitur>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Domain layer harus murni (tanpa React).',
            },
            {
              name: 'drizzle-orm',
              message: 'Domain layer harus murni (tanpa Drizzle ORM/DB).',
            },
          ],
          patterns: [
            {
              group: [
                'next/*',
                'drizzle-orm/*',
                '../application/*',
                '../infrastructure/*',
                '../presentation/*',
                '@/shared/db/*',
                '@/shared/ui/*',
              ],
              message:
                'Domain layer harus murni dan tidak boleh mengimpor lapisan application, infrastructure, presentation, DB, atau UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Application layer tidak boleh bergantung pada React.',
            },
          ],
          patterns: [
            {
              group: [
                'next/*',
                '../infrastructure/*',
                '../presentation/*',
                '@/shared/ui/*',
              ],
              message:
                'Application use-case harus menerima repository lewat parameter (port) dan dilarang mengimpor infrastructure atau presentation.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/tests/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  }
);
