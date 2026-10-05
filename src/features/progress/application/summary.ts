import { SECTIONS, type SectionId, type SectionStatus } from '@/features/sections/domain/sections';
import { curriculumScenePosition, outlineOf } from '@/features/curriculum/application/outline';
import { latestRecord, type ProgressRecord } from '../domain/progress';
import {
  catalogItem,
  modeCatalog,
  PRIMARY_MODE,
  PROGRESS_CATALOG,
  type ModeCatalog,
} from './catalog';

/**
 * Avance calculado a partir del registro canónico. Lo usan el panel del estudiante, el
 * panel docente y las tarjetas de sección: una sola fórmula para todas las vistas.
 */

export interface Fraction {
  readonly done: number;
  readonly total: number;
  readonly percent: number;
}

export interface ModeProgress extends Fraction {
  readonly mode: ModeCatalog['mode'];
  readonly unit: string;
  readonly kind: ModeCatalog['kind'];
}

export interface ResumePoint {
  readonly label: string;
  readonly href: string;
  readonly title: string;
}

export interface SectionProgress {
  readonly section: SectionId;
  readonly status: SectionStatus;
  /** `null` mientras la sección no tenga contenido que completar. */
  readonly lessons: Fraction | null;
  readonly modes: readonly ModeProgress[];
  readonly resume: ResumePoint | null;
  readonly lastActivityAt: number;
}

export interface RecentActivity {
  readonly key: string;
  readonly text: string;
  readonly href: string | null;
  readonly at: number;
}

export interface LearnerProgress {
  readonly overall: Fraction;
  readonly sections: readonly SectionProgress[];
  readonly resume: ResumePoint | null;
  readonly recent: readonly RecentActivity[];
  readonly lastActivityAt: number;
}

export function fraction(done: number, total: number): Fraction {
  const bounded = Math.min(done, total);
  return {
    done: bounded,
    total,
    percent: total > 0 ? Math.round((bounded / total) * 100) : 0,
  };
}

function isCurrent(record: ProgressRecord): boolean {
  const item = catalogItem(record);
  return item !== undefined && (item.version === null || record.contentVersion === item.version);
}

export function modeProgress(
  catalog: ModeCatalog,
  records: readonly ProgressRecord[],
): ModeProgress {
  const own = records.filter(
    (record) => record.section === catalog.section && record.mode === catalog.mode,
  );
  let done: number;
  if (catalog.kind === 'position') {
    const percent = Math.max(0, ...own.map((record) => record.percent));
    done = Math.round((percent / 100) * catalog.total);
  } else {
    done = own.filter((record) => record.status === 'completed' && isCurrent(record)).length;
  }
  return {
    mode: catalog.mode,
    unit: catalog.unit,
    kind: catalog.kind,
    ...fraction(done, catalog.total),
  };
}

function resumeFor(section: SectionId, records: readonly ProgressRecord[]): ResumePoint | null {
  const catalog = modeCatalog(section, PRIMARY_MODE);
  if (!catalog) return null;
  const last = latestRecord(
    records,
    (record) => record.section === section && record.mode === PRIMARY_MODE,
  );
  const item = last ? catalogItem(last) : catalog.items[0];
  if (!item?.href) return null;
  return last
    ? { label: `Continuar en ${item.label}`, href: item.href, title: item.label }
    : { label: `Empezar por «${item.label}»`, href: item.href, title: item.label };
}

function activityText(record: ProgressRecord): string | null {
  const item = catalogItem(record);
  if (!item) return null;
  if (record.mode === 'study') {
    return record.status === 'completed'
      ? `Completaste la lección «${item.label}»`
      : `Abriste la lección «${item.label}»`;
  }
  if (record.mode === 'practice') {
    return record.status === 'completed' ? `Resolviste la ${item.label.toLowerCase()}` : null;
  }
  if (record.mode === 'challenge') {
    return record.status === 'completed'
      ? `Cerraste la ${item.label.toLowerCase()}`
      : `Empezaste la ${item.label.toLowerCase()}`;
  }
  if (record.mode === 'class') {
    const scene = outlineOf(record.section)
      ? curriculumScenePosition(record.section, record.state)
      : record.state.scene;
    return typeof scene === 'number' ? `Exposición: escena ${scene}` : 'Abriste la exposición';
  }
  return null;
}

export function recentActivity(
  records: readonly ProgressRecord[],
  limit = 5,
): readonly RecentActivity[] {
  return [...records]
    .filter((record) => record.lastActivityAt > 0)
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
    .flatMap((record) => {
      const text = activityText(record);
      return text
        ? [
            {
              key: `${record.section}/${record.mode}/${record.item}`,
              text,
              href: catalogItem(record)?.href ?? null,
              at: record.lastActivityAt,
            },
          ]
        : [];
    })
    .slice(0, limit);
}

export function learnerProgress(records: readonly ProgressRecord[]): LearnerProgress {
  const sections = SECTIONS.map((section): SectionProgress => {
    const catalogs = PROGRESS_CATALOG.filter((entry) => entry.section === section.id);
    const modes = catalogs.map((catalog) => modeProgress(catalog, records));
    const lessons = modes.find((mode) => mode.mode === PRIMARY_MODE) ?? null;
    const own = records.filter((record) => record.section === section.id);
    return {
      section: section.id,
      status: section.status,
      lessons: lessons ? fraction(lessons.done, lessons.total) : null,
      modes,
      resume: resumeFor(section.id, records),
      lastActivityAt: Math.max(0, ...own.map((record) => record.lastActivityAt)),
    };
  });
  const tracked = sections.flatMap((section) => (section.lessons ? [section.lessons] : []));
  const overall = fraction(
    tracked.reduce((sum, item) => sum + item.done, 0),
    tracked.reduce((sum, item) => sum + item.total, 0),
  );
  const latest = latestRecord(records, (record) => record.mode === PRIMARY_MODE);
  const resume =
    (latest && resumeFor(latest.section as SectionId, records)) ??
    sections.find((section) => section.resume)?.resume ??
    null;
  return {
    overall,
    sections,
    resume,
    recent: recentActivity(records),
    lastActivityAt: Math.max(0, ...records.map((record) => record.lastActivityAt)),
  };
}
