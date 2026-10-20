import { RecordTable } from '@/presentation/components/data/record-table';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Progress, StatusBadge } from '@/presentation/components/ui';
import type { RosterSummary, StudentRow } from '../application/roster';
import { TeacherStudentSearch } from './teacher-student-search';

/**
 * Panel docente. Accesos directos a evaluaciones, banco, sala en vivo y resultados; cifras del
 * grupo y lista de estudiantes con su avance, última actividad y estado de conexión.
 */

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function lastActivity(student: StudentRow): string {
  return student.lastActivityAt > 0 ? dateFormat.format(student.lastActivityAt) : 'Sin actividad';
}

/**
 * Accesos directos del docente. Rutas existentes; la autorización la hace cada página (y RLS).
 */
const SHORTCUTS: readonly {
  readonly href: Route;
  readonly title: string;
  readonly detail: string;
}[] = [
  {
    href: '/teacher/assessments' as Route,
    title: 'Evaluaciones',
    detail: 'Crear, publicar y supervisar',
  },
  {
    href: '/teacher/questions' as Route,
    title: 'Banco de preguntas',
    detail: 'Preguntas por sección y tema',
  },
  {
    href: '/presenter' as Route,
    title: 'Crear sala en vivo',
    detail: 'Código y QR para la clase',
  },
  {
    href: '/teacher/assessments#group-finalizadas' as Route,
    title: 'Resultados',
    detail: 'Notas de evaluaciones finalizadas',
  },
];

function Stat({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className="teacher-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function TeacherDashboard({
  teacherName,
  roster,
  students,
  query,
  refresher,
  page = 1,
}: {
  readonly teacherName: string;
  readonly roster: RosterSummary;
  readonly students: readonly StudentRow[];
  readonly query: string;
  readonly refresher?: ReactNode;
  readonly page?: number;
}) {
  // La búsqueda y el resumen usan todo el grupo; solo se presenta una página de filas.
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const currentPage = Math.min(Number.isSafeInteger(page) && page > 0 ? page : 1, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visibleStudents = students.slice(start, start + pageSize);
  const pageHref = (number: number): Route => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', String(number));
    return `/teacher?${params.toString()}#teacher-students-title` as Route;
  };
  return (
    <div className="teacher-page">
      <header className="ds-page-header teacher-page__header">
        <div className="site-container teacher-page__header-inner">
          <div className="teacher-page__intro">
            <h1>Seguimiento del grupo</h1>
            <p className="ds-page-header__lead">
              {teacherName}: avance de cada estudiante registrado en DB LAB, con la misma medida que
              ve cada uno en su panel.
            </p>
          </div>
          <nav className="teacher-shortcuts" aria-label="Accesos directos del panel docente">
            <ul>
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.title}>
                  <Link href={shortcut.href} className="teacher-shortcut">
                    <span className="teacher-shortcut__title">
                      {shortcut.title}
                      <span aria-hidden="true"> →</span>
                    </span>
                    <span className="teacher-shortcut__detail">{shortcut.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="site-container teacher-page__content">
        <section aria-labelledby="teacher-summary-title">
          <h2 id="teacher-summary-title" className="visually-hidden">
            Resumen del grupo
          </h2>
          <dl className="teacher-stats">
            <Stat value={String(roster.registered)} label="Estudiantes registrados" />
            <Stat value={String(roster.recentlyActive)} label="Activos en los últimos 7 días" />
            <Stat value={String(roster.online)} label="Conectados ahora" />
            <Stat value={`${roster.averagePercent}\u202f%`} label="Progreso promedio" />
          </dl>
        </section>

        <section aria-labelledby="teacher-sections-title" className="teacher-block">
          <h2 id="teacher-sections-title">Progreso por sección</h2>
          <ul className="teacher-sections">
            {roster.sections.map((section) => (
              <li key={section.section}>
                {section.tracked ? (
                  <Progress
                    label={`${section.title} · promedio del grupo`}
                    value={section.averagePercent}
                    max={100}
                  />
                ) : (
                  <div className="teacher-sections__pending">
                    <span>{section.title}</span>
                    <StatusBadge tone="coming-soon">Próximamente</StatusBadge>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="teacher-students-title" className="teacher-block">
          <div className="teacher-block__head">
            <h2 id="teacher-students-title">Estudiantes</h2>
            {refresher}
          </div>
          <TeacherStudentSearch key={query} query={query}>
            <p className="teacher-results" role="status">
              {query
                ? `${students.length} de ${roster.registered} estudiantes coinciden con «${query}».`
                : `${roster.registered} estudiantes registrados.`}
            </p>
            {totalPages > 1 && (
              <p className="teacher-results teacher-page-range">
                Mostrando {start + 1}–{Math.min(start + pageSize, students.length)} de{' '}
                {students.length} estudiantes.
              </p>
            )}
            {students.length > 0 ? (
              <RecordTable
                caption="Estudiantes registrados"
                columns={['Nombre', 'Correo', 'Progreso general', 'Última actividad', 'Estado']}
                rows={visibleStudents.map((student) => ({
                  key: student.id,
                  cells: [
                    <span key="name">
                      {student.name}
                      {student.institutional && (
                        <span className="teacher-table__tag">Institucional</span>
                      )}
                    </span>,
                    <span key="email" className="teacher-table__email">
                      {student.email}
                    </span>,
                    <span key="progress">
                      <span className="teacher-meter" aria-hidden="true">
                        <span style={{ width: student.overall.percent + '%' }} />
                      </span>
                      {student.overall.percent} %
                      <span className="teacher-table__detail">
                        {' '}
                        ({student.overall.done}/{student.overall.total} lecciones)
                      </span>
                    </span>,
                    lastActivity(student),
                    <StatusBadge key="status" tone={student.online ? 'available' : 'planned'}>
                      {student.online ? 'Conectado' : 'Desconectado'}
                    </StatusBadge>,
                  ],
                }))}
              />
            ) : (
              <div className="teacher-empty">
                <p>
                  {query
                    ? 'Ningún estudiante coincide con la búsqueda.'
                    : 'Todavía no hay estudiantes registrados. Cuando creen su cuenta aparecerán aquí.'}
                </p>
              </div>
            )}
            {totalPages > 1 && (
              <nav
                className="teacher-pagination teacher-search__row"
                aria-label="Páginas de estudiantes"
              >
                {currentPage > 1 ? (
                  <Link
                    className="ds-button ds-button--secondary"
                    href={pageHref(currentPage - 1)}
                    prefetch={false}
                  >
                    Página anterior
                  </Link>
                ) : (
                  <button type="button" className="ds-button ds-button--secondary" disabled>
                    Página anterior
                  </button>
                )}
                <span aria-current="page">
                  Página {currentPage} de {totalPages}
                </span>
                {currentPage < totalPages ? (
                  <Link
                    className="ds-button ds-button--secondary"
                    href={pageHref(currentPage + 1)}
                    prefetch={false}
                  >
                    Página siguiente
                  </Link>
                ) : (
                  <button type="button" className="ds-button ds-button--secondary" disabled>
                    Página siguiente
                  </button>
                )}
              </nav>
            )}
          </TeacherStudentSearch>
        </section>
      </div>
    </div>
  );
}
