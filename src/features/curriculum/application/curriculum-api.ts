import { EMPLEADOS_DATASET, rowValues, type CellValue } from '@/domain/dataset/empleados';
import {
  EMPRESA_TABLES,
  empresaOracleScript,
  empresaTable,
  type EmpresaTableDefinition,
} from '@/domain/dataset/empresa';
import type { SectionId } from '@/features/sections/domain/sections';
import {
  conceptById,
  curriculumOf,
  unitOf,
  exampleById,
  lessonExamples,
  sectionActivities,
} from '../domain/registry';
import type {
  Activity,
  ActivityOption,
  CurriculumConcept,
  CurriculumExample,
  CurriculumLesson,
  ExampleVisual,
  JoinKind,
  LessonExample,
  Mistake,
  SceneNotes,
  CurriculumUnit,
  SectionCurriculum,
  SourceView,
  TraceStep,
} from '../domain/types';
import { curriculumLessonHref } from './outline';
import {
  VERIFIED,
  verifiedResult,
  type OracleErrorText,
  type VerifiedTable,
} from './verified-results';

/**
 * Superficie de la fuente curricular para la presentación. Convierte lecciones, ejemplos y
 * actividades en vistas listas para mostrar: tablas de origen tomadas del dataset, resultados
 * verificados en Oracle y visualizaciones (JOIN, grupos, etapas, PL/SQL) calculadas a partir
 * de esos mismos datos. Nada de lo que muestra se escribe a mano.
 */

export type { CellValue } from '@/domain/dataset/empleados';
export type { JoinKind, Mistake, SceneNotes, TraceStep } from '../domain/types';
export type { OracleErrorText } from './verified-results';

export interface TableColumnView {
  readonly name: string;
  readonly type: 'number' | 'text' | 'date';
}

export interface TableSchemaView {
  readonly idColumn?: string;
  readonly nameColumn?: string;
  readonly tabGroups?: readonly { readonly title: string; readonly columns: readonly string[] }[];
}

export interface TableView {
  /** Nombre de la tabla o rótulo del resultado. */
  readonly title: string;
  readonly columns: readonly TableColumnView[];
  readonly rows: readonly (readonly CellValue[])[];
  readonly schema?: TableSchemaView;
  /** Filas totales de la tabla cuando se muestran solo algunas. */
  readonly totalRows: number;
  /** Consulta de comprobación que produjo la tabla (antes y después de un bloque PL/SQL). */
  readonly query?: string;
}

export interface VerificationView {
  readonly engine: string;
  readonly verifiedAt: string;
}

export interface ExampleView {
  readonly id: string;
  readonly kind: 'query' | 'plsql';
  readonly code: string;
  /** Objetos creados antes del código (PL/SQL). */
  readonly setup: readonly string[];
  readonly sources: readonly TableView[];
  readonly result: TableView | null;
  readonly error: OracleErrorText | null;
  readonly output: readonly string[];
  readonly before: readonly TableView[];
  readonly after: readonly TableView[];
  readonly trace: readonly TraceStep[];
}

/* ---------- Visualizaciones ---------- */

export type ChipState = 'matched' | 'kept-null' | 'discarded';

export interface JoinChip {
  readonly label: string;
  readonly key: CellValue;
  readonly state: ChipState;
  /** Etiquetas de las filas del otro lado con las que forma pareja. */
  readonly partners: readonly string[];
}

export interface JoinVisualView {
  readonly kind: 'join';
  readonly join: JoinKind;
  readonly condition: string;
  readonly left: {
    readonly table: string;
    readonly key: string;
    readonly chips: readonly JoinChip[];
  };
  readonly right: {
    readonly table: string;
    readonly key: string;
    readonly chips: readonly JoinChip[];
  };
  readonly pairs: number;
}

export interface GroupView {
  readonly key: readonly CellValue[];
  readonly members: readonly string[];
}

export interface GroupVisualView {
  readonly kind: 'group';
  readonly table: string;
  readonly by: readonly string[];
  readonly groups: readonly GroupView[];
  readonly rows: number;
}

export interface PipelineStageView {
  readonly label: string;
  readonly example: ExampleView;
}

export type VisualView =
  | { readonly kind: 'transform' }
  | JoinVisualView
  | GroupVisualView
  | { readonly kind: 'pipeline'; readonly stages: readonly PipelineStageView[] }
  | {
      readonly kind: 'compare';
      readonly other: ExampleView;
      readonly labels: readonly [string, string];
    }
  | { readonly kind: 'flow' }
  | { readonly kind: 'cursor'; readonly query: ExampleView }
  | { readonly kind: 'trigger'; readonly event: string; readonly timing: string };

export interface LessonExampleView {
  readonly question: string;
  readonly reading: string;
  readonly example: ExampleView;
  readonly visual: VisualView;
}

/* ---------- Actividades ---------- */

export interface ActivityOptionView {
  readonly text: string;
  readonly code: boolean;
  readonly correct: boolean;
  readonly feedback: string;
}

export interface ActivityResultOptionView {
  readonly id: string;
  readonly table: TableView;
  readonly correct: boolean;
  readonly feedback: string;
}

export type ActivityView = {
  readonly id: string;
  readonly prompt: string;
  readonly hints: readonly [string, string];
  readonly explanation: string;
  readonly lesson: { readonly id: string; readonly title: string; readonly href: string } | null;
  readonly context: {
    readonly code: string | null;
    readonly example: ExampleView | null;
    readonly showResult: boolean;
  };
} & (
  | { readonly kind: 'choice' | 'multi'; readonly options: readonly ActivityOptionView[] }
  | { readonly kind: 'order'; readonly pieces: readonly string[] }
  | { readonly kind: 'count'; readonly answer: number; readonly unit: 'rows' | 'value' | 'lines' }
  | { readonly kind: 'result'; readonly options: readonly ActivityResultOptionView[] }
);

/* ---------- Tablas ---------- */

function schemaOf(table: EmpresaTableDefinition): TableSchemaView {
  return {
    idColumn: table.idColumn,
    ...(table.nameColumn ? { nameColumn: table.nameColumn } : {}),
    tabGroups: table.fieldGroups,
  };
}

const EMPLEADOS_V2_SCHEMA: TableSchemaView = { idColumn: 'ID_EMPLEADO', nameColumn: 'NOMBRE' };

function datasetRows(dataset: string, table: string) {
  if (dataset === 'empleados-v2') {
    const columns = EMPLEADOS_DATASET.columns.map(({ name, type }) => ({ name, type }));
    return {
      columns,
      rows: EMPLEADOS_DATASET.rows.map((row) => rowValues(EMPLEADOS_DATASET, row)),
      schema: EMPLEADOS_V2_SCHEMA,
    };
  }
  const definition = empresaTable(table);
  if (!definition) throw new Error(`Tabla desconocida: ${table}`);
  return {
    columns: definition.columns.map(({ name, type }) => ({ name, type })),
    rows: definition.rows,
    schema: schemaOf(definition),
  };
}

/** Tabla de origen tal como se muestra: columnas elegidas y filas indicadas (por clave). */
export function sourceTable(dataset: string, view: SourceView): TableView {
  const data = datasetRows(dataset, view.table);
  const indexes = view.columns.map((name) =>
    data.columns.findIndex((column) => column.name === name),
  );
  const keys = view.keys ? new Set(view.keys) : null;
  const rows = data.rows.filter((row) => !keys || keys.has(row[0] as number));
  const shown = new Set(view.columns);
  const groups = data.schema.tabGroups
    ?.map((group) => ({ ...group, columns: group.columns.filter((column) => shown.has(column)) }))
    .filter((group) => group.columns.length > 0);
  return {
    title: view.table,
    columns: indexes.map((index) => data.columns[index]!),
    rows: rows.map((row) => indexes.map((index) => row[index] ?? null)),
    schema: {
      ...(data.schema.idColumn && shown.has(data.schema.idColumn)
        ? { idColumn: data.schema.idColumn }
        : {}),
      ...(data.schema.nameColumn && shown.has(data.schema.nameColumn)
        ? { nameColumn: data.schema.nameColumn }
        : {}),
      ...(groups ? { tabGroups: groups } : {}),
    },
    totalRows: data.rows.length,
  };
}

function resultTable(title: string, table: VerifiedTable): TableView {
  return {
    title,
    columns: table.columns,
    rows: table.rows,
    totalRows: table.rows.length,
  };
}

/** Script Oracle del dataset de las secciones 2 y 3 (descarga para ejecutar en Oracle). */
export function datasetScript(): string {
  return empresaOracleScript();
}

/** Tablas completas de un dataset (diccionario de datos de la sección). */
export function datasetTables(dataset: 'empresa-v1'): readonly TableView[] {
  void dataset;
  return EMPRESA_TABLES.map((table) => ({
    title: table.name,
    columns: table.columns.map(({ name, type }) => ({ name, type })),
    rows: table.rows,
    schema: schemaOf(table),
    totalRows: table.rows.length,
  }));
}

export interface TableDictionaryView {
  readonly name: string;
  readonly purpose: string;
  readonly primaryKey: readonly string[];
  readonly foreignKeys: readonly { readonly columns: string; readonly references: string }[];
  readonly columns: readonly {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly description: string;
  }[];
}

export function datasetDictionary(): readonly TableDictionaryView[] {
  return EMPRESA_TABLES.map((table) => ({
    name: table.name,
    purpose: table.purpose,
    primaryKey: table.primaryKey.columns,
    foreignKeys: table.foreignKeys.map((key) => ({
      columns: key.columns.join(', '),
      references: `${key.references} (${key.referencedColumns.join(', ')})`,
    })),
    columns: table.columns.map((column) => ({
      name: column.name,
      type: column.oracleType,
      nullable: column.nullable,
      description: column.description,
    })),
  }));
}

/* ---------- Ejemplos ---------- */

function requireExample(id: string): CurriculumExample {
  const example = exampleById(id);
  if (!example) throw new Error(`Ejemplo inexistente: ${id}`);
  return example;
}

export function exampleView(id: string): ExampleView {
  const example = requireExample(id);
  const result = verifiedResult(id);
  if (example.kind === 'query') {
    return {
      id,
      kind: 'query',
      code: example.sql,
      setup: [],
      sources: example.sources.map((view) => sourceTable(example.dataset, view)),
      result: result?.kind === 'query' ? resultTable('Resultado', result.table) : null,
      error: result?.kind === 'query-error' ? { code: result.code, message: result.message } : null,
      output: [],
      before: [],
      after: [],
      trace: [],
    };
  }
  const plsql = result?.kind === 'plsql' ? result : null;
  return {
    id,
    kind: 'plsql',
    code: example.code,
    setup: example.setup ?? [],
    sources: [],
    result: null,
    error: plsql?.error ?? null,
    output: plsql?.output ?? [],
    before: (plsql?.before ?? []).map((table, index) => probeTable(example.before?.[index], table)),
    after: (plsql?.after ?? []).map((table, index) => probeTable(example.after?.[index], table)),
    trace: example.trace ?? [],
  };
}

/** Título legible de una consulta de estado: «EMPLEADOS», «AUDITORIA_SALARIOS»… */
function tableTitle(sql: string | undefined): string {
  const match = /\bFROM\s+(\w+)/i.exec(sql ?? '');
  return match ? match[1]!.toUpperCase() : 'Resultado';
}

function probeTable(sql: string | undefined, table: VerifiedTable): TableView {
  const view = resultTable(tableTitle(sql), table);
  return sql ? { ...view, query: sql } : view;
}

export function verification(): VerificationView {
  return { engine: VERIFIED.engine, verifiedAt: VERIFIED.verifiedAt };
}

/* ---------- Visualizaciones ---------- */

function chipLabel(table: TableView, row: readonly CellValue[]): string {
  const nameIndex = table.columns.findIndex((column) => column.name === table.schema?.nameColumn);
  const idIndex = table.columns.findIndex((column) => column.name === table.schema?.idColumn);
  const name = nameIndex >= 0 ? row[nameIndex] : null;
  const id = idIndex >= 0 ? row[idIndex] : row[0];
  return name !== null && name !== undefined ? String(name) : `${table.title} ${String(id)}`;
}

function joinVisual(
  example: ExampleView,
  visual: Extract<ExampleVisual, { kind: 'join' }>,
): JoinVisualView {
  const leftTable = example.sources.find((table) => table.title === visual.left);
  const rightTable = example.sources.find((table) => table.title === visual.right);
  if (!leftTable || !rightTable) throw new Error(`${example.id}: faltan tablas del JOIN`);
  const leftIndex = leftTable.columns.findIndex((column) => column.name === visual.leftKey);
  const rightIndex = rightTable.columns.findIndex((column) => column.name === visual.rightKey);
  if (leftIndex < 0 || rightIndex < 0) throw new Error(`${example.id}: faltan las claves del JOIN`);
  const keepLeft = visual.join === 'left' || visual.join === 'full';
  const keepRight = visual.join === 'right' || visual.join === 'full';
  const chips = (
    table: TableView,
    index: number,
    other: TableView,
    otherIndex: number,
    keep: boolean,
  ): JoinChip[] =>
    table.rows.map((row) => {
      const key = row[index] ?? null;
      const partners =
        key === null
          ? []
          : other.rows
              .filter((entry) => entry[otherIndex] === key)
              .map((entry) => chipLabel(other, entry));
      return {
        label: chipLabel(table, row),
        key,
        state: partners.length > 0 ? 'matched' : keep ? 'kept-null' : 'discarded',
        partners,
      };
    });
  const left = chips(leftTable, leftIndex, rightTable, rightIndex, keepLeft);
  const right = chips(rightTable, rightIndex, leftTable, leftIndex, keepRight);
  const alias = (table: string) => table.charAt(0).toLowerCase();
  return {
    kind: 'join',
    join: visual.join,
    condition: `${alias(visual.left)}.${visual.leftKey} = ${visual.left === visual.right ? 'j' : alias(visual.right)}.${visual.rightKey}`,
    left: { table: visual.left, key: visual.leftKey, chips: left },
    right: { table: visual.right, key: visual.rightKey, chips: right },
    pairs: left.reduce((total, chip) => total + chip.partners.length, 0),
  };
}

function groupVisual(
  example: ExampleView,
  visual: Extract<ExampleVisual, { kind: 'group' }>,
): GroupVisualView {
  const table = example.sources.find((entry) => entry.title === visual.table);
  if (!table) throw new Error(`${example.id}: falta la tabla agrupada`);
  const indexes = visual.by.map((name) =>
    table.columns.findIndex((column) => column.name === name),
  );
  const groups = new Map<string, { key: CellValue[]; members: string[] }>();
  for (const row of table.rows) {
    const key = indexes.map((index) => row[index] ?? null);
    const id = JSON.stringify(key);
    const group = groups.get(id) ?? { key, members: [] };
    group.members.push(chipLabel(table, row));
    groups.set(id, group);
  }
  // Orden de los grupos: como Oracle en ORDER BY ascendente, con NULL al final.
  const ordered = [...groups.values()].sort((a, b) => {
    for (let index = 0; index < a.key.length; index++) {
      const x = a.key[index] ?? null;
      const y = b.key[index] ?? null;
      if (x === y) continue;
      if (x === null) return 1;
      if (y === null) return -1;
      return x < y ? -1 : 1;
    }
    return 0;
  });
  return {
    kind: 'group',
    table: visual.table,
    by: visual.by,
    groups: ordered,
    rows: table.rows.length,
  };
}

function visualView(example: ExampleView, visual: ExampleVisual | undefined): VisualView {
  if (!visual) return example.kind === 'plsql' ? { kind: 'flow' } : { kind: 'transform' };
  switch (visual.kind) {
    case 'join':
      return joinVisual(example, visual);
    case 'group':
      return groupVisual(example, visual);
    case 'pipeline':
      return {
        kind: 'pipeline',
        stages: visual.stages.map((stage) => ({
          label: stage.label,
          example: exampleView(stage.example),
        })),
      };
    case 'compare':
      return { kind: 'compare', other: exampleView(visual.other), labels: visual.labels };
    case 'cursor':
      return { kind: 'cursor', query: exampleView(visual.query) };
    case 'trigger':
      return { kind: 'trigger', event: visual.event, timing: visual.timing };
    default:
      return { kind: visual.kind };
  }
}

export function lessonExampleView(entry: LessonExample): LessonExampleView {
  const example = exampleView(entry.example);
  return {
    question: entry.question,
    reading: entry.reading,
    example,
    visual: visualView(example, entry.visual),
  };
}

/* ---------- Rutas ---------- */

export function sectionBase(section: SectionId): string {
  return `/sections/${section}`;
}

export function lessonHref(section: SectionId, slug: string): string {
  return curriculumLessonHref(section, slug);
}

/* ---------- Actividades ---------- */

/** Mezcla estable: el mismo orden en el servidor y en el navegador. */
function stableShuffle<T>(items: readonly T[], seed: string): T[] {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d) >>> 0;
    const swap = hash % (index + 1);
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  return copy;
}

function optionView(option: ActivityOption): ActivityOptionView {
  return {
    text: option.text,
    code: option.code ?? false,
    correct: option.correct,
    feedback: option.feedback,
  };
}

export function activityView(section: SectionId, activity: Activity): ActivityView {
  const curriculum = unitOf(section);
  const lesson = curriculum?.lessons.find((entry) => entry.id === activity.lesson);
  const example = activity.context?.example ? exampleView(activity.context.example) : null;
  const base = {
    id: activity.id,
    prompt: activity.prompt,
    hints: activity.hints,
    explanation: activity.explanation,
    lesson: lesson
      ? { id: lesson.id, title: lesson.title, href: lessonHref(section, lesson.slug) }
      : null,
    context: {
      code: activity.context?.code ?? null,
      example,
      showResult: activity.context?.showResult ?? false,
    },
  };
  switch (activity.kind) {
    case 'choice':
    case 'multi':
      return {
        ...base,
        kind: activity.kind,
        options: stableShuffle(activity.options.map(optionView), activity.id),
      };
    case 'order':
      return { ...base, kind: 'order', pieces: activity.pieces };
    case 'count': {
      if (example?.kind === 'plsql') {
        // Bloque PL/SQL: cuántas líneas escribió DBMS_OUTPUT en Oracle.
        return {
          ...base,
          context: { ...base.context, showResult: false },
          kind: 'count',
          answer: example.output.length,
          unit: 'lines',
        };
      }
      const table = example?.result;
      if (!table) throw new Error(`${activity.id}: sin resultado verificado`);
      const unit = activity.measure ?? 'rows';
      const answer = unit === 'value' ? Number(table.rows[0]?.[0]) : table.rows.length;
      return {
        ...base,
        context: { ...base.context, showResult: false },
        kind: 'count',
        answer,
        unit,
      };
    }
    case 'result': {
      if (!example?.result) throw new Error(`${activity.id}: sin resultado verificado`);
      const options: ActivityResultOptionView[] = [
        { id: example.id, table: example.result, correct: true, feedback: activity.explanation },
        ...activity.distractors.map((distractor) => {
          const view = exampleView(distractor.example);
          if (!view.result) throw new Error(`${distractor.example}: sin resultado verificado`);
          return { id: view.id, table: view.result, correct: false, feedback: distractor.feedback };
        }),
      ];
      return {
        ...base,
        context: { ...base.context, showResult: false },
        kind: 'result',
        options: stableShuffle(options, activity.id),
      };
    }
  }
}

/* ---------- Lecciones y temario ---------- */

export interface ConceptView {
  readonly id: string;
  readonly term: string;
  readonly category: string;
  readonly definition: string;
  readonly purpose: string;
  readonly syntax: string;
  readonly keyIdea: string;
  readonly mistake: Mistake;
  readonly reference: { readonly document: string; readonly topic: string; readonly url: string };
  readonly example: ExampleView;
  /** Lección que lo enseña. */
  readonly lesson: { readonly title: string; readonly href: string } | null;
}

function conceptView(curriculum: CurriculumUnit, concept: CurriculumConcept): ConceptView {
  const lesson = curriculum.lessons.find((entry) => entry.concepts.includes(concept.id));
  return {
    id: concept.id,
    term: concept.term,
    category: concept.category,
    definition: concept.definition,
    purpose: concept.purpose,
    syntax: concept.syntax,
    keyIdea: concept.keyIdea,
    mistake: concept.mistake,
    reference: concept.reference,
    example: exampleView(concept.example),
    lesson: lesson
      ? { title: lesson.title, href: lessonHref(curriculum.section, lesson.slug) }
      : null,
  };
}

export interface LessonSummaryView {
  readonly id: string;
  readonly number: number;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly href: string;
  readonly version: number;
}

export interface BlockView {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly LessonSummaryView[];
}

function lessonOffset(curriculum: CurriculumUnit): number {
  return 'lessonOffset' in curriculum ? Number(curriculum.lessonOffset) : 0;
}

function lessonSummary(curriculum: CurriculumUnit, lesson: CurriculumLesson): LessonSummaryView {
  return {
    id: lesson.id,
    number: lessonOffset(curriculum) + curriculum.lessons.indexOf(lesson) + 1,
    slug: lesson.slug,
    title: lesson.title,
    shortTitle: lesson.shortTitle,
    summary: lesson.summary,
    href: lessonHref(curriculum.section, lesson.slug),
    version: lesson.version,
  };
}

export interface CurriculumIndexView {
  readonly section: SectionId;
  readonly blocks: readonly BlockView[];
  readonly lessonCount: number;
  readonly sceneCount: number;
  readonly practiceCount: number;
  readonly missionCount: number;
  readonly conceptCount: number;
}

export function curriculumIndex(section: SectionId): CurriculumIndexView | null {
  const curriculum = curriculumOf(section);
  if (!curriculum) return null;
  return {
    section,
    blocks: curriculum.blocks.map((block) => ({
      ...block,
      lessons: curriculum.lessons
        .filter((lesson) => lesson.block === block.id)
        .map((lesson) => lessonSummary(curriculum, lesson)),
    })),
    lessonCount: curriculum.lessons.length,
    sceneCount: curriculum.scenes.length,
    practiceCount: curriculum.practice.length,
    missionCount: curriculum.missions.length,
    conceptCount: curriculum.concepts.length,
  };
}

/** Bloques con sus lecciones de una ampliación (o de una sección completa). */
export function unitBlocks(section: SectionId): readonly BlockView[] {
  const unit = unitOf(section);
  if (!unit) return [];
  return unit.blocks.map((block) => ({
    ...block,
    lessons: unit.lessons
      .filter((lesson) => lesson.block === block.id)
      .map((lesson) => lessonSummary(unit, lesson)),
  }));
}

/** Lecciones de la sección (identificador, ruta y versión), para el progreso y las rutas. */
export function lessonSummaries(section: SectionId): readonly LessonSummaryView[] {
  const curriculum = curriculumOf(section);
  return curriculum ? curriculum.lessons.map((lesson) => lessonSummary(curriculum, lesson)) : [];
}

export interface LessonPageView {
  readonly section: SectionId;
  readonly lesson: LessonSummaryView;
  readonly block: { readonly number: number; readonly title: string };
  readonly total: number;
  readonly concepts: readonly ConceptView[];
  readonly purpose: string;
  readonly syntax: string;
  readonly explanation: readonly string[];
  readonly examples: readonly LessonExampleView[];
  readonly changed: readonly string[];
  readonly mistakes: readonly Mistake[];
  readonly check: ActivityView;
  readonly keyIdea: string;
  readonly previous: LessonSummaryView | null;
  readonly next: LessonSummaryView | null;
  /** Trazabilidad: dónde se practica y se evalúa lo de esta lección. */
  readonly practiceCount: number;
  readonly missions: readonly { readonly id: string; readonly title: string }[];
  readonly topic: string;
}

export function lessonPage(section: SectionId, slug: string): LessonPageView | null {
  const curriculum = unitOf(section);
  const lesson = curriculum?.lessons.find((entry) => entry.slug === slug);
  if (!curriculum || !lesson) return null;
  const index = curriculum.lessons.indexOf(lesson);
  const block = curriculum.blocks.find((entry) => entry.id === lesson.block)!;
  const previous = curriculum.lessons[index - 1];
  const next = curriculum.lessons[index + 1];
  return {
    section,
    lesson: lessonSummary(curriculum, lesson),
    block: { number: block.number, title: block.title },
    total: lessonOffset(curriculum) + curriculum.lessons.length,
    concepts: lesson.concepts.map((id) => conceptView(curriculum, conceptById(curriculum, id)!)),
    purpose: lesson.purpose,
    syntax: lesson.syntax,
    explanation: lesson.explanation,
    examples: lessonExamples(lesson).map(lessonExampleView),
    changed: lesson.changed,
    mistakes: lesson.mistakes,
    check: activityView(section, lesson.check),
    keyIdea: lesson.keyIdea,
    previous: previous ? lessonSummary(curriculum, previous) : null,
    next: next ? lessonSummary(curriculum, next) : null,
    practiceCount: curriculum.practice.filter((activity) => activity.lesson === lesson.id).length,
    missions: ('missions' in curriculum ? (curriculum as SectionCurriculum).missions : [])
      .filter((mission) => mission.steps.some((step) => step.lesson === lesson.id))
      .map(({ id, title }) => ({ id, title })),
    topic: lesson.topic,
  };
}

export function lessonSlugs(section: SectionId): readonly string[] {
  return unitOf(section)?.lessons.map(({ slug }) => slug) ?? [];
}

/* ---------- Recursos ---------- */

export interface ResourceBlockView {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly concepts: readonly ConceptView[];
}

export function resourceBlocks(section: SectionId): readonly ResourceBlockView[] {
  const curriculum = curriculumOf(section);
  if (!curriculum) return [];
  const placed = new Set<string>();
  return curriculum.blocks
    .map((block) => {
      const ids = curriculum.lessons
        .filter((lesson) => lesson.block === block.id)
        .flatMap((lesson) => lesson.concepts)
        .filter((id) => !placed.has(id) && placed.add(id));
      return {
        id: block.id,
        number: block.number,
        title: block.title,
        concepts: ids.map((id) => conceptView(curriculum, conceptById(curriculum, id)!)),
      };
    })
    .filter((block) => block.concepts.length > 0);
}

/* ---------- Practicar y Challenge ---------- */

export interface PracticeBlockView {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly activities: readonly ActivityView[];
}

export function practiceBlocks(section: SectionId): readonly PracticeBlockView[] {
  const curriculum = curriculumOf(section);
  if (!curriculum) return [];
  return curriculum.blocks
    .map((block) => {
      const lessons = new Set(
        curriculum.lessons.filter((lesson) => lesson.block === block.id).map(({ id }) => id),
      );
      return {
        id: block.id,
        number: block.number,
        title: block.title,
        activities: curriculum.practice
          .filter((activity) => lessons.has(activity.lesson))
          .map((activity) => activityView(section, activity)),
      };
    })
    .filter((block) => block.activities.length > 0);
}

export interface MissionView {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly skill: string;
  readonly scenario: string;
  readonly steps: readonly ActivityView[];
}

export function missionViews(section: SectionId): readonly MissionView[] {
  const curriculum = curriculumOf(section);
  if (!curriculum) return [];
  return curriculum.missions.map((mission, index) => ({
    id: mission.id,
    number: index + 1,
    title: mission.title,
    skill: mission.skill,
    scenario: mission.scenario,
    steps: mission.steps.map((step) => activityView(section, step)),
  }));
}

/** Identificadores de práctica y misiones (para el registro de progreso). */
export function trackedActivities(section: SectionId): {
  readonly practice: readonly string[];
  readonly missions: readonly { readonly id: string; readonly title: string }[];
  readonly scenes: number;
} {
  const curriculum = curriculumOf(section);
  return {
    practice: curriculum?.practice.map(({ id }) => id) ?? [],
    missions: curriculum?.missions.map(({ id, title }) => ({ id, title })) ?? [],
    scenes: curriculum?.scenes.length ?? 0,
  };
}

/* ---------- Clase ---------- */

export interface SceneView {
  readonly number: number;
  readonly id: string;
  readonly kind: SectionCurriculum['scenes'][number]['kind'];
  readonly block: { readonly id: string; readonly number: number; readonly title: string };
  readonly title: string;
  readonly shortTitle: string;
  readonly notes: SceneNotes;
  readonly points: readonly string[];
  readonly code: string | null;
  readonly keyIdea: string | null;
  readonly lesson: { readonly title: string; readonly href: string } | null;
  readonly example: LessonExampleView | null;
  readonly activity: ActivityView | null;
  /** Pasos del modo «paso a paso». */
  readonly steps: number;
}

export interface DeckView {
  readonly section: SectionId;
  readonly blocks: readonly {
    readonly id: string;
    readonly number: number;
    readonly title: string;
  }[];
  readonly scenes: readonly SceneView[];
}

export function deckView(section: SectionId): DeckView | null {
  const curriculum = curriculumOf(section);
  if (!curriculum) return null;
  const scenes = curriculum.scenes.map((scene, index): SceneView => {
    const lesson = scene.lesson
      ? curriculum.lessons.find((entry) => entry.id === scene.lesson)
      : undefined;
    const entry =
      scene.kind === 'lesson' && lesson
        ? (lessonExamples(lesson).find(
            (item) => item.example === (scene.example ?? lesson.example.example),
          ) ?? lesson.example)
        : null;
    const block = curriculum.blocks.find((item) => item.id === scene.block)!;
    const example = entry ? lessonExampleView(entry) : null;
    // Escena de lección: 1) código, 2) visualización, 3) resultado e idea clave.
    const steps = scene.kind === 'lesson' ? 3 : 1;
    return {
      number: index + 1,
      id: scene.id,
      kind: scene.kind,
      block: { id: block.id, number: block.number, title: block.title },
      title: scene.title,
      shortTitle: scene.shortTitle,
      notes: scene.notes,
      points:
        scene.kind === 'agenda'
          ? curriculum.blocks.map((item) => `${item.number}. ${item.title}`)
          : (scene.points ?? []),
      code: scene.code ?? null,
      keyIdea: scene.keyIdea ?? (scene.kind === 'lesson' ? (lesson?.keyIdea ?? null) : null),
      lesson: lesson ? { title: lesson.title, href: lessonHref(section, lesson.slug) } : null,
      example,
      activity: scene.activity ? activityView(section, scene.activity) : null,
      steps,
    };
  });
  return {
    section,
    blocks: curriculum.blocks.map(({ id, number, title }) => ({ id, number, title })),
    scenes,
  };
}

/** Todas las actividades con identificador (pruebas y depuración). */
export function allActivityIds(section: SectionId): readonly string[] {
  const curriculum = curriculumOf(section);
  return curriculum ? sectionActivities(curriculum).map(({ id }) => id) : [];
}
