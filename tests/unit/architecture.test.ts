// @vitest-environment node
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function architecturalErrors(file: string, code: string): Promise<string[]> {
  const results = await eslint.lintText(code, { filePath: path.resolve(file) });
  return results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId === 'architecture/dependencies')
      .map((message) => message.message),
  );
}

describe('Límites de ARCHITECTURE.md', () => {
  it.each([
    ['src/domain/example.ts', "import type { ReactNode } from 'react';"],
    ['src/domain/example.ts', "import { request } from 'node:https';"],
    ['src/domain/example.ts', "import { run } from '@/application/run';"],
    ['src/application/example.ts', "import { connect } from '../infrastructure/oracle';"],
    ['src/presentation/example.ts', "export * from '@/infrastructure/oracle';"],
    ['src/presentation/example.ts', "const load = () => import('../infrastructure/oracle');"],
    [
      'src/features/lab/presentation/example.ts',
      "import { connect } from '../infrastructure/oracle';",
    ],
    [
      'src/features/lab/application/example.ts',
      "import { client } from '@/features/live/infrastructure/client';",
    ],
  ])('rechaza una dependencia invertida en %s', async (file, code) => {
    expect(await architecturalErrors(file, code)).toHaveLength(1);
  });

  it.each([
    ['src/application/example.ts', "import type { Query } from '@/domain/query';"],
    ['src/infrastructure/example.ts', "import type { Port } from '@/application/ports/query';"],
    ['src/presentation/example.ts', "import { run } from '@/application/run';"],
    ['src/app/page.tsx', "import { Shell } from '@/presentation/layouts/shell';"],
    [
      'src/features/lab/infrastructure/example.ts',
      "import type { Port } from '../application/ports/query';",
    ],
  ])('permite dependencias hacia el núcleo o la presentación desde %s', async (file, code) => {
    expect(await architecturalErrors(file, code)).toEqual([]);
  });
});
