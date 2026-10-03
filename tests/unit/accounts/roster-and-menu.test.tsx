import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccountProfile } from '@/features/accounts/application/account-api';
import { AccountMenu } from '@/features/accounts/presentation/account-menu';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import {
  buildRoster,
  filterStudents,
  ONLINE_WINDOW_MS,
} from '@/features/teacher/application/roster';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

function profile(
  id: string,
  firstName: string,
  lastName: string,
  role: AccountProfile['role'] = 'student',
): AccountProfile {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}@ejemplo.com`,
    role,
    authMethod: 'email',
    institutional: false,
  };
}

const done = (userId: string, item: string): ProgressRecord & { userId: string } => ({
  userId,
  section: 'fundamentos-sql',
  mode: 'study',
  item,
  status: 'completed',
  percent: 100,
  contentVersion: 1,
  state: {},
  lastActivityAt: 1_000,
});

describe('Resumen del grupo (panel docente)', () => {
  const now = 10_000_000;
  const roster = buildRoster({
    profiles: [
      profile('a', 'Ángela', 'Zapata'),
      profile('b', 'Bruno', 'Arias'),
      profile('t', 'Amílcar', 'Sierra', 'teacher'),
    ],
    progress: [done('a', 'L00'), done('a', 'L01'), done('b', 'L00')],
    presence: [
      { userId: 'a', area: 'fundamentos-sql/study', seenAt: now - 60_000 },
      { userId: 'b', area: 'inicio', seenAt: now - ONLINE_WINDOW_MS - 1 },
    ],
    now,
  });

  it('cuenta solo estudiantes, ordena por apellido y calcula conexión', () => {
    expect(roster.students.map(({ name }) => name)).toEqual(['Bruno Arias', 'Ángela Zapata']);
    expect(roster.registered).toBe(2);
    expect(roster.online).toBe(1);
    expect(roster.students[1]).toMatchObject({ online: true, area: 'fundamentos-sql/study' });
    expect(roster.students[0]).toMatchObject({ online: false, area: null });
    // Las tres secciones tienen contenido con seguimiento desde la Fase 4.
    expect(roster.sections.every(({ tracked }) => tracked)).toBe(true);
  });

  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(filterStudents(roster.students, 'angela').map(({ id }) => id)).toEqual(['a']);
    expect(filterStudents(roster.students, 'ARIAS').map(({ id }) => id)).toEqual(['b']);
    expect(filterStudents(roster.students, '  ')).toHaveLength(2);
  });
});

describe('Menú de cuenta', () => {
  const signOut = vi.fn(async () => {});

  it('invitado: estado del progreso y accesos', () => {
    render(<AccountMenu state={{ status: 'guest' }} signOut={signOut} />);
    expect(screen.getByLabelText('Cuenta: invitado')).toBeInTheDocument();
    expect(
      screen.getByText('Tu progreso se está guardando en este dispositivo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Crear cuenta/ })).toHaveAttribute('href', '/register');
  });

  it('estudiante: accesos personales, sin panel docente', () => {
    render(
      <AccountMenu
        state={{
          status: 'authenticated',
          account: {
            displayName: 'Ana Ruiz',
            firstName: 'Ana',
            initials: 'AR',
            email: 'ana@x.co',
            role: 'student',
          },
        }}
        signOut={signOut}
      />,
    );
    expect(screen.getByLabelText('Cuenta de Ana Ruiz')).toBeInTheDocument();
    for (const name of ['Mi progreso', 'Mi perfil', 'Secciones']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'Panel docente' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('profesor: además, el panel docente', () => {
    render(
      <AccountMenu
        state={{
          status: 'authenticated',
          account: {
            displayName: 'Amílcar Sierra',
            firstName: 'Amílcar',
            initials: 'AS',
            email: 'p@x.co',
            role: 'teacher',
          },
        }}
        signOut={signOut}
      />,
    );
    expect(screen.getByRole('link', { name: 'Panel docente' })).toHaveAttribute('href', '/teacher');
  });
});
