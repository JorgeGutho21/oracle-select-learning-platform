import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeacherDashboard } from '@/features/teacher/presentation/teacher-dashboard';
import { buildRoster, filterStudents } from '@/features/teacher/application/roster';

const roster = buildRoster({
  profiles: Array.from({ length: 63 }, (_, index) => ({
    id: `student-${index}`,
    firstName: 'Estudiante & <grupo> +',
    lastName: String(index).padStart(3, '0'),
    email: `student-${String(index).padStart(3, '0')}@example.com`,
    role: 'student' as const,
    authMethod: 'email' as const,
    institutional: false,
  })),
  progress: [],
  presence: [],
  now: 1_000,
});
const dashboard = (page = 1, query = '') => (
  <TeacherDashboard
    teacherName="Docente"
    roster={roster}
    students={filterStudents(roster.students, query)}
    query={query}
    page={page}
  />
);
const fullTable = () => within(document.querySelector('.record-table__full') as HTMLElement);
const rows = () => fullTable().getAllByRole('row', { name: /Estudiante/ });

describe('Paginación del grupo docente', () => {
  it('presenta bloques de 25 y permite recorrer todos los estudiantes, sin omitir ni duplicar', () => {
    const { rerender, container } = render(dashboard());
    const collected: string[] = [];
    for (let page = 1; page <= 3; page++) {
      rerender(dashboard(page));
      expect(rows()).toHaveLength(page === 3 ? 13 : 25);
      expect(container.querySelectorAll('.record-table tbody tr').length).toBeLessThanOrEqual(75);
      collected.push(
        ...rows().map(
          (row) => within(row).getByRole('cell', { name: /@example.com/ }).textContent!,
        ),
      );
      expect(screen.getByText('63 estudiantes registrados.')).toBeInTheDocument();
      expect(screen.getByText(`Página ${page} de 3`)).toHaveAttribute('aria-current', 'page');
    }
    expect(collected).toEqual(roster.students.map((student) => student.email));
    expect(new Set(collected).size).toBe(63);
    expect(screen.getByText('Mostrando 51–63 de 63 estudiantes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it.each([NaN, Infinity, -2, 0, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'una página inválida %s vuelve al primer bloque',
    (page) => {
      render(dashboard(page));
      expect(rows()).toHaveLength(25);
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    },
  );

  it('limita una página fuera del rango al último bloque y conserva los totales completos', () => {
    render(dashboard(999));
    expect(rows()).toHaveLength(13);
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByText('63 estudiantes registrados.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Página anterior' })).toHaveAttribute(
      'href',
      '/teacher?page=2#teacher-students-title',
    );
  });

  it('codifica la búsqueda en los enlaces, conserva todas las coincidencias y un nuevo GET reinicia la página', () => {
    const query = 'Estudiante & <grupo> +';
    render(dashboard(2, query));
    expect(rows()).toHaveLength(25);
    expect(screen.getByRole('status')).toHaveTextContent(
      `63 de 63 estudiantes coinciden con «${query}».`,
    );
    const navigation = screen.getByRole('navigation', { name: 'Páginas de estudiantes' });
    const next = within(navigation).getByRole('link', { name: 'Página siguiente' });
    const url = new URL(next.getAttribute('href')!, 'https://example.test');
    expect(url.pathname).toBe('/teacher');
    expect(url.searchParams.get('q')).toBe(query);
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.hash).toBe('#teacher-students-title');
    const form = screen.getByRole('search') as HTMLFormElement;
    expect([...new FormData(form).entries()]).toEqual([['q', query]]);
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/teacher');
  });

  it('una búsqueda única o vacía no presenta páginas innecesarias', () => {
    const { rerender } = render(dashboard(99, 'student-062@example.com'));
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('1 de 63 estudiantes coinciden');
    expect(screen.queryByRole('navigation', { name: 'Páginas de estudiantes' })).toBeNull();
    rerender(dashboard(99, 'sin-coincidencias'));
    expect(screen.getByText('Ningún estudiante coincide con la búsqueda.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Páginas de estudiantes' })).toBeNull();
  });
});
