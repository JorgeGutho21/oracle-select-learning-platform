import type { Route } from 'next';
import Link from 'next/link';
import { PixelCard } from '@/presentation/components/effects/pixel-card';
import { Chip } from '@/presentation/components/ui';
import {
  ASSESSMENT_TOPICS,
  QUESTION_STATUS_LABEL,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPES,
  topicLabel,
  type QuestionStatus,
  type QuestionType,
} from '../application/assessment-api';

/**
 * Banco de preguntas del profesor: búsqueda y filtros en el servidor, paginado (el banco
 * completo nunca se descarga), estado del banco oficial por sección y alta de preguntas.
 */

export interface BankRow {
  readonly id: string;
  readonly externalKey: string | null;
  readonly origin: 'dblab' | 'teacher';
  readonly section: string;
  readonly topic: string;
  readonly type: QuestionType;
  readonly prompt: string;
  readonly difficulty: number;
  readonly status: QuestionStatus;
  readonly version: number;
}

export interface BankFilter {
  readonly section?: string | undefined;
  readonly topic?: string | undefined;
  readonly type?: string | undefined;
  readonly status?: string | undefined;
  readonly search?: string | undefined;
  readonly page: number;
}

export function OfficialBankPanel({
  official,
  sectionTitles,
  sync,
}: {
  readonly official: readonly {
    readonly section: string;
    readonly available: number;
    readonly published: number;
    readonly target: number;
  }[];
  readonly sectionTitles: Readonly<Record<string, string>>;
  readonly sync: () => Promise<void>;
}) {
  return (
    <section className="teacher-block" aria-labelledby="official-bank-title">
      <h2 id="official-bank-title">Banco por sección</h2>
      <ul className="bank-sections">
        {official.map((entry) => (
          <li key={entry.section}>
            <PixelCard className="bank-section">
              <p className="bank-section__title">{sectionTitles[entry.section] ?? entry.section}</p>
              <p className="bank-section__value">
                {entry.published}
                <span> publicadas · meta {entry.target}</span>
              </p>
              <p className="bank-section__detail">
                {entry.available > 0
                  ? `${entry.available} preguntas oficiales de DB LAB listas para sincronizar.`
                  : 'Sin banco oficial todavía: llega con el contenido de la sección. Puedes crear preguntas propias.'}
              </p>
            </PixelCard>
          </li>
        ))}
      </ul>
      <form action={sync} className="bank-sync">
        <button type="submit" className="ds-button ds-button--secondary">
          Sincronizar banco oficial de DB LAB
        </button>
        <p className="ds-field__hint">
          Añade las preguntas oficiales nuevas y actualiza las que cambiaron (con nueva versión).
          Las evaluaciones publicadas conservan su copia.
        </p>
      </form>
    </section>
  );
}

function pageHref(filter: BankFilter, page: number): Route {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filter, page: String(page) })) {
    if (value && !(key === 'page' && value === '1'))
      params.set(key === 'search' ? 'q' : key, String(value));
  }
  const query = params.toString();
  return `/teacher/questions${query ? `?${query}` : ''}` as Route;
}

export function QuestionBankView({
  rows,
  total,
  pages,
  filter,
  sections,
}: {
  readonly rows: readonly BankRow[];
  readonly total: number;
  readonly pages: number;
  readonly filter: BankFilter;
  readonly sections: readonly { readonly id: string; readonly title: string }[];
}) {
  const topics = filter.section
    ? (ASSESSMENT_TOPICS[filter.section as keyof typeof ASSESSMENT_TOPICS] ?? [])
    : [];
  return (
    <section className="teacher-block" aria-labelledby="bank-list-title">
      <div className="teacher-block__head">
        <h2 id="bank-list-title">Preguntas</h2>
        <Link href={'/teacher/questions/new' as Route} className="ds-button ds-button--primary">
          Nueva pregunta
        </Link>
      </div>
      <form className="bank-filters" role="search" action={'/teacher/questions' as Route}>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="bank-q">
            Buscar en el enunciado
          </label>
          <input
            id="bank-q"
            className="ds-input"
            type="search"
            name="q"
            defaultValue={filter.search}
            maxLength={80}
          />
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="bank-section">
            Sección
          </label>
          <select
            id="bank-section"
            className="ds-input"
            name="section"
            defaultValue={filter.section ?? ''}
          >
            <option value="">Todas</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
        {topics.length > 0 && (
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="bank-topic">
              Tema
            </label>
            <select
              id="bank-topic"
              className="ds-input"
              name="topic"
              defaultValue={filter.topic ?? ''}
            >
              <option value="">Todos</option>
              {topics.map((topic) => (
                <option key={topic.key} value={topic.key}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="bank-type">
            Tipo
          </label>
          <select id="bank-type" className="ds-input" name="type" defaultValue={filter.type ?? ''}>
            <option value="">Todos</option>
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="bank-status">
            Estado
          </label>
          <select
            id="bank-status"
            className="ds-input"
            name="status"
            defaultValue={filter.status ?? ''}
          >
            <option value="">Todos</option>
            {(['published', 'draft', 'retired'] as const).map((status) => (
              <option key={status} value={status}>
                {QUESTION_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="ds-button ds-button--primary">
          Filtrar
        </button>
      </form>
      <p className="teacher-results" role="status">
        {total} {total === 1 ? 'pregunta' : 'preguntas'}
        {pages > 1 ? ` · página ${filter.page} de ${pages}` : ''}
      </p>
      {rows.length === 0 ? (
        <p className="assessment-empty">
          No hay preguntas con esos filtros. Si el banco está vacío, sincroniza el banco oficial o
          crea una pregunta.
        </p>
      ) : (
        <ul className="bank-list">
          {rows.map((row) => (
            <li key={row.id} className="bank-item">
              <div className="bank-item__meta">
                <Chip
                  tone={
                    row.status === 'published'
                      ? 'success'
                      : row.status === 'retired'
                        ? 'neutral'
                        : 'warning'
                  }
                >
                  {QUESTION_STATUS_LABEL[row.status]}
                </Chip>
                <span>{row.externalKey ?? 'Propia'}</span>
                <span>v{row.version}</span>
                <span>{topicLabel(row.section as never, row.topic)}</span>
                <span>{QUESTION_TYPE_LABEL[row.type]}</span>
                <span>dificultad {row.difficulty}</span>
              </div>
              <Link className="bank-item__prompt" href={`/teacher/questions/${row.id}` as Route}>
                {row.prompt}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav className="bank-pages" aria-label="Páginas del banco">
          {filter.page > 1 && (
            <Link
              className="ds-button ds-button--secondary"
              href={pageHref(filter, filter.page - 1)}
            >
              Anterior
            </Link>
          )}
          {filter.page < pages && (
            <Link
              className="ds-button ds-button--secondary"
              href={pageHref(filter, filter.page + 1)}
            >
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
