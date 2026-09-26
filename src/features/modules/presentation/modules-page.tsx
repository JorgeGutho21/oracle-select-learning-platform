import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  currentLevel,
  levelAnchor,
  STAGE_LABEL,
  topicAnchor,
  upcomingLevels,
  type CurriculumTopic,
} from '../application/modules-api';
import { SCENE_TOTAL } from '@/features/presentation/application/presentation-api';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  STUDY_BLOCKS,
} from '@/features/study/application/lesson-index';
import { SqlCode } from '@/presentation/components/data/sql-code';
import { Chip } from '@/presentation/components/ui';

/**
 * Ruta de aprendizaje: el nivel actual (AHORA) con sus bloques y lecciones, y los niveles
 * futuros con fichas completas (definición, utilidad, sintaxis, ejemplo, prerrequisitos y
 * errores frecuentes). Los temas futuros no tienen lecciones ni cuentan en el progreso.
 */

function TopicCard({ topic }: { readonly topic: CurriculumTopic }) {
  const titleId = `${topicAnchor(topic)}-title`;
  return (
    <li id={topicAnchor(topic)} className="topic-card">
      <article aria-labelledby={titleId}>
        <header className="topic-card__header">
          <code className="topic-card__keyword">{topic.keyword}</code>
          <Chip tone="warning">Próximamente</Chip>
        </header>
        <h4 id={titleId} className="topic-card__title">
          {topic.title}
        </h4>
        <p className="topic-card__definition">{topic.shortDefinition}</p>
        <p className="topic-card__purpose">
          <strong>Para qué sirve:</strong> {topic.purpose}
        </p>
        <details className="topic-card__more">
          <summary>Sintaxis y ejemplo</summary>
          <SqlCode sql={topic.syntax} label="Sintaxis mínima" />
          <SqlCode sql={topic.example} label="Ejemplo" />
          <p className="topic-card__note">{topic.exampleNote}</p>
          {(topic.before || topic.after) && (
            <dl className="topic-card__states">
              {topic.before && (
                <div>
                  <dt>Antes</dt>
                  <dd>{topic.before}</dd>
                </div>
              )}
              {topic.after && (
                <div>
                  <dt>Después</dt>
                  <dd>{topic.after}</dd>
                </div>
              )}
            </dl>
          )}
          {topic.warning && (
            <p className="topic-card__warning">
              <span aria-hidden="true">⚠ </span>
              <strong>Advertencia:</strong> {topic.warning}
            </p>
          )}
          {topic.commonErrors.length > 0 && (
            <p className="topic-card__error">
              <strong>Error frecuente:</strong> {topic.commonErrors.join(' ')}
            </p>
          )}
        </details>
        <p className="topic-card__meta">
          Nivel {topic.level}
          {topic.prerequisites.length > 0 && <> · Requiere: {topic.prerequisites.join(', ')}</>}
        </p>
      </article>
    </li>
  );
}

export function ModulesPage({ currentProgress }: { readonly currentProgress: ReactNode }) {
  const current = currentLevel();
  const levels = upcomingLevels();
  return (
    <div className="modules-page">
      <header className="modules-hero">
        <div className="site-container">
          <p className="study-eyebrow">Ruta de aprendizaje</p>
          <h1>De SELECT a una base de datos completa</h1>
          <p className="modules-hero__lead">
            Hoy está disponible el nivel 1, SELECT fundamental. Los niveles siguientes ya tienen sus
            temas definidos: aparecen como «Próximamente» y no cuentan en tu progreso.
          </p>
          <ol className="modules-stages" aria-label="Etapas de la ruta">
            <li className="modules-stages__now">
              <strong>Ahora</strong> SELECT fundamental
            </li>
            <li>
              <strong>Siguiente nivel</strong> Funciones y agrupación
            </li>
            <li>
              <strong>Más adelante</strong> JOIN, subconsultas, modificar datos y DDL
            </li>
          </ol>
        </div>
      </header>
      <div className="site-container modules-body">
        <section
          id={levelAnchor(current)}
          className="level level--current"
          aria-labelledby="level-1-title"
        >
          <header className="level__header">
            <span className="level__number" aria-hidden="true">
              {String(current.number).padStart(2, '0')}
            </span>
            <div>
              <Chip tone="cyan">{STAGE_LABEL[current.stage]}</Chip>
              <h2 id="level-1-title">
                <span className="visually-hidden">Nivel {current.number}: </span>
                {current.title}
              </h2>
              <p>{current.summary}</p>
              <p className="level__meta">
                {LESSON_COUNT} lecciones · {SCENE_TOTAL} escenas de exposición · laboratorio con
                Oracle · SQL Challenge
              </p>
            </div>
            <div className="level__progress">{currentProgress}</div>
          </header>
          <ol className="level__blocks">
            {STUDY_BLOCKS.map((block) => (
              <li key={block.id}>
                <h3>
                  <span aria-hidden="true">{block.letter}</span> {block.title}
                </h3>
                <ul>
                  {LESSON_INDEX.filter((lesson) => lesson.block === block.id).map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/learn/${lesson.slug}` as Route}>
                        <code>{lesson.badge}</code> {lesson.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <Link className="inline-action" href="/presentation">
            Iniciar clase en Modo Exposición <span aria-hidden="true">→</span>
          </Link>
        </section>

        {levels.map((level) => {
          const groups = [...new Set(level.topics.map((topic) => topic.group))];
          return (
            <section
              key={level.id}
              id={levelAnchor(level)}
              className="level level--future"
              aria-labelledby={`level-${level.number}-title`}
            >
              <header className="level__header">
                <span className="level__number" aria-hidden="true">
                  {String(level.number).padStart(2, '0')}
                </span>
                <div>
                  <Chip tone="warning">{STAGE_LABEL[level.stage]}</Chip>
                  <h2 id={`level-${level.number}-title`}>
                    <span className="visually-hidden">Nivel {level.number}: </span>
                    {level.title}
                  </h2>
                  <p>{level.summary}</p>
                  {level.progression && (
                    <p className="level__progression">
                      <strong>Progresión:</strong> {level.progression}
                    </p>
                  )}
                  <p className="level__meta">
                    Requiere: {level.prerequisites.map((number) => `Nivel ${number}`).join(', ')} ·{' '}
                    {level.topics.length} temas · Próximamente
                  </p>
                </div>
              </header>
              {groups.map((group) => (
                <div key={group} className="level__group">
                  <h3>{group}</h3>
                  <ul className="topic-grid">
                    {level.topics
                      .filter((topic) => topic.group === group)
                      .map((topic) => (
                        <TopicCard key={topic.id} topic={topic} />
                      ))}
                  </ul>
                </div>
              ))}
              {level.number === 6 && (
                <p className="level__safety">
                  Estas sentencias modifican datos. Cuando se activen, se practicarán en una base de
                  pruebas aislada: el laboratorio actual nunca modifica EMPLEADOS.
                </p>
              )}
            </section>
          );
        })}

        <p className="modules-note">
          ¿Buscas un tema? Consulta la <Link href={'/resources#chuleta' as Route}>chuleta</Link> o
          usa el buscador (Ctrl+K).
        </p>
      </div>
    </div>
  );
}
