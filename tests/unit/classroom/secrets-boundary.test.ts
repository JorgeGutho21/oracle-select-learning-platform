// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve('src');
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
const sources = files(root)
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => ({
    file: path.relative(root, file).replaceAll('\\', '/'),
    text: readFileSync(file, 'utf8'),
  }));
const clientModules = sources.filter(({ text }) => /^['"]use client['"]/.test(text.trimStart()));

describe('Sala en vivo · secretos fuera del navegador', () => {
  it('la clave de servicio de Supabase solo se lee en módulos de servidor', () => {
    const readers = sources
      .filter(({ text }) => /SUPABASE_SERVICE_ROLE_KEY|serviceRoleKey/.test(text))
      .map(({ file }) => file);
    expect(readers.sort()).toEqual([
      'composition/classroom/classroom-server.ts',
      'features/classroom/infrastructure/classroom-config.ts',
      'features/classroom/infrastructure/notifiers.ts',
    ]);
    expect(clientModules.some(({ file }) => readers.includes(file))).toBe(false);
  });

  it('la raíz de servidor de la sala está marcada server-only y ningún cliente la importa', () => {
    const server = sources.find(({ file }) => file === 'composition/classroom/classroom-server.ts');
    expect(server?.text.startsWith("import 'server-only';")).toBe(true);
    const offenders = clientModules.filter(({ text }) =>
      /classroom-server|node-secrets|classroom-config|memory-classroom-repository|supabase-classroom-repository/.test(
        text,
      ),
    );
    expect(offenders.map(({ file }) => file)).toEqual([]);
  });

  it('las acciones de la sala son Server Functions y guardan la identidad en cookies httpOnly', () => {
    const actions = sources.find(({ file }) => file === 'composition/classroom/actions.ts');
    expect(actions?.text.trimStart().startsWith("'use server';")).toBe(true);
    expect(actions?.text).toMatch(/httpOnly: true/);
    expect(actions?.text).not.toMatch(/localStorage|sessionStorage/);
  });
});
