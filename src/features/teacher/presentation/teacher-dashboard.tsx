import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Progress, StatusBadge } from '@/presentation/components/ui';
import type { RosterSummary, StudentRow } from '../application/roster';

/**
 * Panel docente (fundación). Cifras del grupo y lista de estudiantes con su avance, última
 * actividad y estado de conexión. Las evaluaciones y la supervisión llegan en otras fases.
 */

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function lastActivity(student: StudentRow): string {
  return student.lastActivityAt > 0 ? dateFormat.format(student.lastActivityAt) : 'Sin actividad';
}

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
}: {
  readonly teacherName: string;
  readonly roster: RosterSummary;
  readonly students: readonly StudentRow[];
  readonly query: string;
  readonly refresher?: ReactNode;
}) {
  return (
    <div className="teacher-page">
      <header className="ds-page-header ds-page-header--night">
        <div className="site-container ds-page-header__inner">
          <p className="ds-page-header__eyebrow">Panel docente</p>
          <h1>Seguimiento del grupo</h1>
          <p className="ds-page-header__lead">
            {teacherName}: avance de cada estudiante registrado en DB LAB, con la misma medida que
            ve cada uno en su panel.
          </p>
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
          <form className="teacher-search" role="search" action={'/teacher' as Route}>
            <label htmlFor="teacher-search-input">Buscar por nombre, apellido o correo</label>
            <div className="teacher-search__row">
              <input
                id="teacher-search-input"
                className="ds-input"
                type="search"
                name="q"
                defaultValue={query}
                maxLength={80}
                autoComplete="off"
              />
              <button type="submit" className="ds-button ds-button--primary">
                Buscar
              </button>
              {query && (
                <Link href={'/teacher' as Route} className="ds-button ds-button--text">
                  Ver todos
                </Link>
              )}
            </div>
          </form>
          <p className="teacher-results" role="status">
            {query
              ? `${students.length} de ${roster.registered} estudiantes coinciden con «${query}».`
              : `${roster.registered} estudiantes registrados.`}
          </p>
          {students.length > 0 ? (
            <div
              className="teacher-table-wrap"
              role="region"
              aria-labelledby="teacher-students-title"
              tabIndex={0}
            >
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th scope="col">Estudiante</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Progreso</th>
                    <th scope="col">Última actividad</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <th scope="row" className="teacher-table__name">
                        {student.name}
                        {student.institutional && (
                          <span className="teacher-table__tag">Institucional</span>
                        )}
                      </th>
                      <td className="teacher-table__email">{student.email}</td>
                      <td className="teacher-table__progress">
                        <span className="teacher-meter" aria-hidden="true">
                          <span style={{ inlineSize: `${student.overall.percent}%` }} />
                        </span>
                        <span>
                          {student.overall.percent} %
                          <span className="teacher-table__detail">
                            {' '}
                            ({student.overall.done}/{student.overall.total} lecciones)
                          </span>
                        </span>
                      </td>
                      <td className="teacher-table__activity">{lastActivity(student)}</td>
                      <td className="teacher-table__status">
                        <StatusBadge tone={student.online ? 'available' : 'planned'}>
                          {student.online ? 'Conectado' : 'Desconectado'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="teacher-empty">
              <p>
                {query
                  ? 'Ningún estudiante coincide con la búsqueda.'
                  : 'Todavía no hay estudiantes registrados. Cuando creen su cuenta aparecerán aquí.'}
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="teacher-next-title" className="teacher-block teacher-next">
          <h2 id="teacher-next-title">Próximas fases</h2>
          <p>
            Las evaluaciones con banco de preguntas y su supervisión se añadirán sobre estas mismas
            cuentas y roles. Hoy este panel solo muestra avance de aprendizaje.
          </p>
        </section>
      </div>
    </div>
  );
}
