import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import architecture from './scripts/architecture-boundaries.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { architecture },
    rules: { 'architecture/dependencies': 'error' },
  },
  {
    files: ['src/domain/**/*.ts', 'src/features/*/domain/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'La red pertenece a infraestructura.' },
        { name: 'window', message: 'El dominio es independiente del navegador.' },
        { name: 'document', message: 'El dominio es independiente del navegador.' },
        { name: 'localStorage', message: 'El almacenamiento pertenece a infraestructura.' },
        { name: 'sessionStorage', message: 'El almacenamiento pertenece a infraestructura.' },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);
