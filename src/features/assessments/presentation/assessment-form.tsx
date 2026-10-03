'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button } from '@/presentation/components/ui';
import { TextField } from '@/presentation/components/ui/text-field';
import {
  ASSESSMENT_TOPICS,
  FEEDBACK_LABEL,
  FEEDBACK_MODES,
  LIMITS,
  QUESTION_TYPE_LABEL,
  SUGGESTED_COUNTS,
  topicLabel,
  type FeedbackMode,
  type QuestionType,
} from '../application/assessment-api';
import { INITIAL_TEACHER_FORM, type TeacherFormState } from '../application/teacher-notices';

/**
 * Nueva evaluación (o borrador). Guardar nunca publica: publicar es una acción aparte en la
 * ficha de la evaluación. El banco completo no se descarga: solo las preguntas publicadas,
 * con lo necesario para elegirlas.
 */

export interface PickerQuestion {
  readonly id: string;
  readonly externalKey: string | null;
  readonly section: string;
  readonly topic: string;
  readonly type: QuestionType;
  readonly prompt: string;
  readonly difficulty: number;
}

export interface PickerStudent {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly institutional: boolean;
}

export interface AssessmentFormValues {
  readonly id?: string;
  readonly title: string;
  readonly description: string;
  readonly sectionKey: string;
  readonly topics: readonly string[];
  readonly selectionMode: 'manual' | 'random';
  readonly questionIds: readonly string[];
  readonly questionCount: number;
  readonly durationMinutes: number;
  readonly opensAt: string;
  readonly closesAt: string;
  readonly maxAttempts: number;
  readonly shuffleQuestions: boolean;
  readonly shuffleOptions: boolean;
  readonly feedbackMode: FeedbackMode;
  readonly audience: 'all' | 'selected';
  readonly studentIds: readonly string[];
  readonly institutionalOnly: boolean;
  readonly recordClipboard: boolean;
  readonly passGrade: string;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Summary({ state }: { readonly state: TeacherFormState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === 'error') ref.current?.focus();
  }, [state]);
  return (
    <div ref={ref} tabIndex={-1} className="teacher-form__summary">
      {state.status === 'error' && <Alert tone="danger" title={state.message} live />}
    </div>
  );
}

function FieldError({ id, error }: { readonly id: string; readonly error: string | undefined }) {
  return error ? (
    <p className="ds-field__error" id={id}>
      {error}
    </p>
  ) : null;
}

export function AssessmentForm({
  action,
  values,
  sections,
  bank,
  topicCounts,
  students,
}: {
  readonly action: (state: TeacherFormState, formData: FormData) => Promise<TeacherFormState>;
  readonly values: AssessmentFormValues;
  readonly sections: readonly { readonly id: string; readonly title: string }[];
  readonly bank: readonly PickerQuestion[];
  readonly topicCounts: Readonly<Record<string, number>>;
  readonly students: readonly PickerStudent[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_TEACHER_FORM);
  const errors = state.fieldErrors;
  const [section, setSection] = useState(values.sectionKey);
  const [mode, setMode] = useState(values.selectionMode);
  const [topics, setTopics] = useState<ReadonlySet<string>>(new Set(values.topics));
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set(values.questionIds));
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState(values.audience);
  const [assigned, setAssigned] = useState<ReadonlySet<string>>(new Set(values.studentIds));
  const [studentSearch, setStudentSearch] = useState('');
  const [count, setCount] = useState(String(values.questionCount));

  const sectionTopics = ASSESSMENT_TOPICS[section as keyof typeof ASSESSMENT_TOPICS] ?? [];
  const sectionBank = useMemo(
    () => bank.filter((question) => question.section === section),
    [bank, section],
  );
  const visible = useMemo(() => {
    const needle = normalize(search.trim());
    return sectionBank.filter(
      (question) =>
        (topics.size === 0 || topics.has(question.topic)) &&
        (!needle ||
          normalize(question.prompt).includes(needle) ||
          normalize(question.externalKey ?? '').includes(needle)),
    );
  }, [search, sectionBank, topics]);
  const available =
    mode === 'manual'
      ? chosen.size
      : topics.size === 0
        ? (topicCounts[section] ?? 0)
        : [...topics].reduce(
            (total, topic) => total + (topicCounts[`${section}:${topic}`] ?? 0),
            0,
          );
  const matchingStudents = useMemo(() => {
    const needle = normalize(studentSearch.trim());
    return students.filter(
      (student) =>
        !needle ||
        normalize(`${student.firstName} ${student.lastName} ${student.email}`).includes(needle),
    );
  }, [studentSearch, students]);

  const toggle = (set: ReadonlySet<string>, value: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(value);
    else next.delete(value);
    return next;
  };

  return (
    <form action={formAction} className="teacher-form" noValidate>
      <Summary state={state} />
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset className="teacher-form__group">
        <legend>Datos</legend>
        <TextField
          label="Nombre de la evaluación"
          name="title"
          defaultValue={values.title}
          required
          minLength={LIMITS.title.min}
          maxLength={LIMITS.title.max}
          error={errors.title}
        />
        <div className={`ds-field${errors.description ? ' ds-field--invalid' : ''}`}>
          <label className="ds-field__label" htmlFor="assessment-description">
            Descripción (opcional)
          </label>
          <textarea
            id="assessment-description"
            name="description"
            className="ds-input teacher-form__textarea"
            defaultValue={values.description}
            maxLength={LIMITS.description}
            rows={3}
          />
          <FieldError id="assessment-description-error" error={errors.description} />
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="assessment-section">
            Sección
          </label>
          <select
            id="assessment-section"
            name="section_key"
            className="ds-input"
            value={section}
            onChange={(event) => {
              setSection(event.currentTarget.value);
              setTopics(new Set());
              setChosen(new Set());
            }}
          >
            {sections.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
          <FieldError id="assessment-section-error" error={errors.section_key} />
        </div>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Preguntas</legend>
        <div
          className="teacher-form__choices"
          role="radiogroup"
          aria-label="Cómo se eligen las preguntas"
        >
          <label className="teacher-choice">
            <input
              type="radio"
              name="selection_mode"
              value="manual"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
            />
            <span>
              <strong>Selección manual</strong>
              <span>
                Eliges las preguntas. Si eliges más de las que tendrá, cada estudiante recibe una
                parte.
              </span>
            </span>
          </label>
          <label className="teacher-choice">
            <input
              type="radio"
              name="selection_mode"
              value="random"
              checked={mode === 'random'}
              onChange={() => setMode('random')}
            />
            <span>
              <strong>Selección automática</strong>
              <span>
                Indicas temas y cantidad. Cada estudiante recibe una selección equivalente en
                dificultad y temas.
              </span>
            </span>
          </label>
        </div>
        <fieldset className="teacher-form__topics">
          <legend>
            Temas {mode === 'random' ? 'incluidos' : '(filtran la lista)'} · sin marcar = todos
          </legend>
          <ul>
            {sectionTopics.map((topic) => (
              <li key={topic.key}>
                <label className="teacher-check">
                  <input
                    type="checkbox"
                    name="topics"
                    value={topic.key}
                    checked={topics.has(topic.key)}
                    onChange={(event) =>
                      setTopics(toggle(topics, topic.key, event.currentTarget.checked))
                    }
                  />
                  {topic.label}{' '}
                  <span className="teacher-check__count">
                    ({topicCounts[`${section}:${topic.key}`] ?? 0})
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {mode === 'manual' && (
          <div className="question-picker">
            <div className="question-picker__head">
              <TextField
                label="Buscar en el banco publicado"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                autoComplete="off"
              />
              <p role="status" className="question-picker__count">
                {chosen.size} elegidas · {visible.length} de {sectionBank.length} visibles
              </p>
            </div>
            <FieldError id="assessment-questions-error" error={errors.question_ids} />
            {sectionBank.length === 0 ? (
              <p className="assessment-empty">
                No hay preguntas publicadas en esta sección. Créalas o sincroniza el banco oficial
                en «Banco de preguntas».
              </p>
            ) : (
              <ul className="question-picker__list">
                {sectionBank.map((question) => (
                  <li key={question.id} hidden={!visible.includes(question)}>
                    <label className="question-picker__item">
                      <input
                        type="checkbox"
                        name="question_ids"
                        value={question.id}
                        checked={chosen.has(question.id)}
                        onChange={(event) =>
                          setChosen(toggle(chosen, question.id, event.currentTarget.checked))
                        }
                      />
                      <span className="question-picker__text">
                        <span className="question-picker__meta">
                          {question.externalKey ?? 'Propia'} ·{' '}
                          {topicLabel(section as never, question.topic)} ·{' '}
                          {QUESTION_TYPE_LABEL[question.type]} · dificultad {question.difficulty}
                        </span>
                        <span>{question.prompt}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="teacher-form__row">
          <TextField
            label="Cantidad de preguntas por estudiante"
            name="question_count"
            type="number"
            inputMode="numeric"
            min={LIMITS.questionCount.min}
            max={LIMITS.questionCount.max}
            list="assessment-count-suggestions"
            value={count}
            onChange={(event) => setCount(event.currentTarget.value)}
            hint={`Disponibles: ${available}. Sugeridas: ${SUGGESTED_COUNTS.join(', ')}.`}
            error={errors.question_count}
          />
          <datalist id="assessment-count-suggestions">
            {SUGGESTED_COUNTS.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Tiempo y disponibilidad</legend>
        <div className="teacher-form__row">
          <TextField
            label="Duración (minutos)"
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min={LIMITS.duration.min}
            max={LIMITS.duration.max}
            defaultValue={values.durationMinutes}
            error={errors.duration_minutes}
          />
          <TextField
            label="Intentos permitidos"
            name="max_attempts"
            type="number"
            inputMode="numeric"
            min={LIMITS.attempts.min}
            max={LIMITS.attempts.max}
            defaultValue={values.maxAttempts}
            error={errors.max_attempts}
          />
        </div>
        <div className="teacher-form__row">
          <TextField
            label="Apertura (opcional)"
            name="opens_at"
            type="datetime-local"
            defaultValue={values.opensAt}
            hint="Hora de Colombia. Vacía: disponible al publicar."
            error={errors.opens_at}
          />
          <TextField
            label="Cierre (opcional)"
            name="closes_at"
            type="datetime-local"
            defaultValue={values.closesAt}
            hint="Nadie comienza después; los intentos terminan a esta hora como máximo."
            error={errors.closes_at}
          />
        </div>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Orden</legend>
        <label className="teacher-check">
          <input
            type="checkbox"
            name="shuffle_questions"
            defaultChecked={values.shuffleQuestions}
          />
          Orden aleatorio de preguntas para cada estudiante
        </label>
        <label className="teacher-check">
          <input type="checkbox" name="shuffle_options" defaultChecked={values.shuffleOptions} />
          Orden aleatorio de opciones
        </label>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Al entregar, el estudiante ve</legend>
        {FEEDBACK_MODES.map((feedback) => (
          <label className="teacher-check" key={feedback}>
            <input
              type="radio"
              name="feedback_mode"
              value={feedback}
              defaultChecked={values.feedbackMode === feedback}
            />
            {FEEDBACK_LABEL[feedback]}
          </label>
        ))}
        <p className="ds-field__hint">
          Puedes liberarla o retenerla después desde la ficha de la evaluación.
        </p>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Participantes</legend>
        <label className="teacher-check">
          <input
            type="radio"
            name="audience"
            value="all"
            checked={audience === 'all'}
            onChange={() => setAudience('all')}
          />
          Todos los estudiantes registrados
        </label>
        <label className="teacher-check">
          <input
            type="radio"
            name="audience"
            value="selected"
            checked={audience === 'selected'}
            onChange={() => setAudience('selected')}
          />
          Solo los estudiantes que elija
        </label>
        <label className="teacher-check">
          <input
            type="checkbox"
            name="institutional_only"
            defaultChecked={values.institutionalOnly}
          />
          Solo estudiantes con correo institucional confirmado
        </label>
        {audience === 'selected' && (
          <div className="student-picker">
            <TextField
              label="Buscar estudiante"
              type="search"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.currentTarget.value)}
              autoComplete="off"
            />
            <p role="status" className="question-picker__count">
              {assigned.size} elegidos
            </p>
            <FieldError id="assessment-students-error" error={errors.student_ids} />
            <ul className="student-picker__list">
              {students.map((student) => (
                <li key={student.id} hidden={!matchingStudents.includes(student)}>
                  <label className="teacher-check">
                    <input
                      type="checkbox"
                      name="student_ids"
                      value={student.id}
                      checked={assigned.has(student.id)}
                      onChange={(event) =>
                        setAssigned(toggle(assigned, student.id, event.currentTarget.checked))
                      }
                    />
                    {student.firstName} {student.lastName}{' '}
                    <span className="teacher-check__count">{student.email}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Supervisión y nota</legend>
        <label className="teacher-check">
          <input type="checkbox" name="record_clipboard" defaultChecked={values.recordClipboard} />
          Registrar intentos de copiar, pegar y abrir el menú contextual (no se bloquean)
        </label>
        <p className="ds-field__hint">
          Siempre se registran la pérdida de foco, la desconexión y la salida de pantalla completa.
          Son señales del navegador, no pruebas de fraude.
        </p>
        <TextField
          label="Nota mínima para aprobar"
          name="pass_grade"
          inputMode="decimal"
          defaultValue={values.passGrade}
          hint="Escala 0.0 a 5.0."
          error={errors.pass_grade}
        />
      </fieldset>

      <div className="teacher-form__actions">
        <Button type="submit" pending={pending} pendingLabel="Guardando…">
          Guardar borrador
        </Button>
        <p className="ds-field__hint">
          Guardar no publica. Revisa la ficha y publica cuando esté lista.
        </p>
      </div>
    </form>
  );
}
