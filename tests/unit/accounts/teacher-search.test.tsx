import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TeacherDashboard } from '@/features/teacher/presentation/teacher-dashboard';
import { buildRoster, filterStudents } from '@/features/teacher/application/roster';

const roster = buildRoster({
  profiles: ['first', 'second'].map((id) => ({
    id,
    firstName: 'Valentina',
    lastName: 'Zuleta',
    email: `${id}@example.com`,
    role: 'student' as const,
    authMethod: 'email' as const,
    institutional: false,
  })),
  progress: [],
  presence: [],
  now: 1_000,
});
const dashboard = (query = '') => (
  <TeacherDashboard
    teacherName="Docente"
    roster={roster}
    students={filterStudents(roster.students, query)}
    query={query}
  />
);

// jsdom no aplica los media queries: se inspecciona una representación tabular completa.
const fullTable = () => within(document.querySelector('.record-table__full') as HTMLElement);

describe('Búsqueda del grupo: transición entre resultados', () => {
  it('marca la solicitud pendiente, conserva q en GET y no expone las filas previas como coincidencias', () => {
    const { rerender } = render(dashboard());
    expect(fullTable().getAllByRole('row', { name: /Valentina Zuleta/ })).toHaveLength(2);
    const input = screen.getByRole('searchbox', { name: 'Buscar por nombre, apellido o correo' });
    fireEvent.change(input, { target: { value: 'second@example.com' } });
    const form = screen.getByRole('search');
    fireEvent.submit(form);
    expect(form).toHaveAttribute('method', 'get');
    expect(form).toHaveAttribute('action', '/teacher');
    expect(new FormData(form as HTMLFormElement).get('q')).toBe('second@example.com');
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('status')).toHaveTextContent('Buscando estudiantes…');
    expect(screen.queryAllByRole('row', { name: /Valentina Zuleta/ })).toHaveLength(0);
    expect(fullTable().getByText('first@example.com').closest('[hidden]')).not.toBeNull();
    expect(fullTable().getByText('first@example.com').closest('[aria-busy]')).toHaveAttribute(
      'aria-busy',
      'true',
    );

    rerender(dashboard('second@example.com'));
    expect(fullTable().getAllByRole('row', { name: /Valentina Zuleta/ })).toHaveLength(1);
    expect(fullTable().getByRole('row', { name: /Valentina Zuleta/ })).toHaveTextContent(
      'second@example.com',
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 de 2 estudiantes coinciden');
    expect(screen.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  });

  it('SSR conserva el formulario GET y las filas; espera eventos antes de habilitar Buscar', () => {
    const markup = renderToString(dashboard('first@example.com'));
    const document = new DOMParser().parseFromString(markup, 'text/html');
    const form = document.querySelector('form.teacher-search')!;
    expect(form.getAttribute('method')).toBe('get');
    expect(form.getAttribute('action')).toBe('/teacher');
    expect(form.querySelector('button[type="submit"]')!.hasAttribute('disabled')).toBe(true);
    expect(form.querySelector('input[name="q"]')!.hasAttribute('disabled')).toBe(false);
    expect(document.querySelector('[aria-busy]')!.getAttribute('aria-busy')).toBe('false');
    expect(document.querySelector('[aria-busy]')!.firstElementChild!.hasAttribute('hidden')).toBe(
      false,
    );
  });

  it('restaura los resultados previos al volver al documento mediante historial', () => {
    render(dashboard());
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.queryAllByRole('row', { name: /Valentina Zuleta/ })).toHaveLength(0);
    fireEvent(window, new Event('pageshow'));
    expect(fullTable().getAllByRole('row', { name: /Valentina Zuleta/ })).toHaveLength(2);
    expect(screen.queryByText('Buscando estudiantes…')).toBeNull();
  });
});
