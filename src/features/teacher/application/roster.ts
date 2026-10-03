import type { AccountProfile } from '@/features/accounts/domain/account';
import { displayName } from '@/features/accounts/domain/account';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import { sectionIsTracked } from '@/features/progress/application/catalog';
import {
  learnerProgress,
  type Fraction,
  type SectionProgress,
} from '@/features/progress/application/summary';
import { SECTIONS, type SectionId } from '@/features/sections/domain/sections';

/**
 * Resumen del grupo para el panel docente, con la misma fórmula de avance que ve cada
 * estudiante. No calcula notas ni evaluaciones (fases siguientes).
 */

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface PresenceEntry {
  readonly userId: string;
  readonly area: string;
  readonly seenAt: number;
}

export interface OwnedProgressRecord extends ProgressRecord {
  readonly userId: string;
}

export interface StudentRow {
  readonly id: string;
  readonly name: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly institutional: boolean;
  readonly overall: Fraction;
  readonly sections: readonly SectionProgress[];
  readonly lastActivityAt: number;
  readonly online: boolean;
  readonly area: string | null;
}

export interface SectionAverage {
  readonly section: SectionId;
  readonly title: string;
  readonly tracked: boolean;
  readonly averagePercent: number;
}

export interface RosterSummary {
  readonly students: readonly StudentRow[];
  readonly registered: number;
  readonly recentlyActive: number;
  readonly online: number;
  readonly averagePercent: number;
  readonly sections: readonly SectionAverage[];
}

function average(values: readonly number[]): number {
  return values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

export function buildRoster(input: {
  readonly profiles: readonly AccountProfile[];
  readonly progress: readonly OwnedProgressRecord[];
  readonly presence: readonly PresenceEntry[];
  readonly now: number;
}): RosterSummary {
  const byUser = new Map<string, ProgressRecord[]>();
  for (const record of input.progress) {
    const list = byUser.get(record.userId) ?? [];
    list.push(record);
    byUser.set(record.userId, list);
  }
  const presence = new Map(input.presence.map((entry) => [entry.userId, entry]));
  const students = input.profiles
    .filter((profile) => profile.role === 'student')
    .map((profile): StudentRow => {
      const progress = learnerProgress(byUser.get(profile.id) ?? []);
      const seen = presence.get(profile.id);
      const online = seen !== undefined && input.now - seen.seenAt <= ONLINE_WINDOW_MS;
      return {
        id: profile.id,
        name: displayName(profile),
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        institutional: profile.institutional,
        overall: progress.overall,
        sections: progress.sections,
        lastActivityAt: Math.max(progress.lastActivityAt, seen?.seenAt ?? 0),
        online,
        area: online ? (seen?.area ?? null) : null,
      };
    })
    .sort(
      (a, b) => a.lastName.localeCompare(b.lastName, 'es') || a.name.localeCompare(b.name, 'es'),
    );
  const sections = SECTIONS.map((section): SectionAverage => {
    const values = students.flatMap((student) => {
      const item = student.sections.find((entry) => entry.section === section.id);
      return item?.lessons ? [item.lessons.percent] : [];
    });
    return {
      section: section.id,
      title: section.title,
      tracked: sectionIsTracked(section.id),
      averagePercent: average(values),
    };
  });
  return {
    students,
    registered: students.length,
    recentlyActive: students.filter(
      (student) =>
        student.lastActivityAt > 0 && input.now - student.lastActivityAt <= RECENT_WINDOW_MS,
    ).length,
    online: students.filter((student) => student.online).length,
    averagePercent: average(students.map((student) => student.overall.percent)),
    sections,
  };
}

/** Búsqueda sencilla por nombre, apellido o correo, sin distinguir tildes ni mayúsculas. */
export function filterStudents(
  students: readonly StudentRow[],
  query: string,
): readonly StudentRow[] {
  const fold = (value: string) =>
    value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
  const needle = fold(query.trim());
  if (!needle) return students;
  return students.filter((student) =>
    fold(`${student.firstName} ${student.lastName} ${student.email}`).includes(needle),
  );
}
