'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Alert, Button } from '@/presentation/components/ui';
import { TextField } from '@/presentation/components/ui/text-field';
import {
  ASSESSMENT_TOPICS,
  DIFFICULTIES,
  QUESTION_TYPE_LABEL,
  QUESTION_TYPES,
  RESPONSE_KINDS_BY_TYPE,
  type QuestionType,
  type ResponseKind,
} from '../application/assessment-api';
import { MAX_FORM_OPTIONS } from '../application/form-values';
import { INITIAL_TEACHER_FORM, type TeacherFormState } from '../application/teacher-notices';

/**
 * Pregunta propia del profesor. Las preguntas oficiales de DB LAB no se editan aquí: se
 * duplican. Guardar una pregunta usada en una evaluación publicada crea una versión nueva;
 * la evaluación conserva su copia.
 */

export interface QuestionFormValues {
  readonly id?: string;
  readonly section: string;
  readonly topic: string;
  readonly subtopic: string;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly difficulty: number;
  readonly weight: string;
  readonly prompt: string;
  readonly code: string;
  readonly exhibitTable: string;
  readonly options: readonly {
    readonly body: string;
    readonly kind: 'text' | 'code';
    readonly correct: boolean;
    readonly order: number;
    readonly feedback: string;
  }[];
  readonly explanation: string;
  readonly concept: string;
  readonly review: string;
  readonly reference: string;
  readonly tags: string;
  readonly status: 'draft' | 'published';
}

const KIND_LABEL: Readonly<Record<ResponseKind, string>> = {
  single: 'Una respuesta correcta',
  multiple: 'Varias respuestas correctas',
  order: 'Ordenar fragmentos',
};

function Textarea({
  label,
  name,
  defaultValue,
  rows = 3,
  maxLength,
  hint,
  error,
  code = false,
}: {
  readonly label: string;
  readonly name: string;
  readonly defaultValue: string;
  readonly rows?: number;
  readonly maxLength: number;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly code?: boolean;
}) {
  const id = `question-${name}`;
  return (
    <div className={`ds-field${error ? ' ds-field--invalid' : ''}`}>
      <label className="ds-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        className={`ds-input teacher-form__textarea${code ? ' teacher-form__textarea--code' : ''}`}
        defaultValue={defaultValue}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
          undefined
        }
        spellCheck={!code}
      />
      {hint && (
        <p className="ds-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ds-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function QuestionForm({
  action,
  values,
  sections,
}: {
  readonly action: (state: TeacherFormState, formData: FormData) => Promise<TeacherFormState>;
  readonly values: QuestionFormValues;
  readonly sections: readonly { readonly id: string; readonly title: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_TEACHER_FORM);
  const errors = state.fieldErrors;
  const summary = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState(values.section);
  const [type, setType] = useState<QuestionType>(values.type);
  const allowed = RESPONSE_KINDS_BY_TYPE[type];
  const [response, setResponse] = useState<ResponseKind>(
    allowed.includes(values.response) ? values.response : allowed[0]!,
  );
  const kind = allowed.includes(response) ? response : allowed[0]!;
  const options = Array.from({ length: MAX_FORM_OPTIONS }, (_, index) => values.options[index]);

  useEffect(() => {
    if (state.status === 'error') summary.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="teacher-form" noValidate>
      <div ref={summary} tabIndex={-1} className="teacher-form__summary">
        {state.status === 'error' && <Alert tone="danger" title={state.message} live />}
      </div>
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <fieldset className="teacher-form__group">
        <legend>Clasificación</legend>
        <div className="teacher-form__row">
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="question-section">
              Sección
            </label>
            <select
              id="question-section"
              name="section"
              className="ds-input"
              value={section}
              onChange={(event) => setSection(event.currentTarget.value)}
            >
              {sections.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </div>
          <div className={`ds-field${errors.topic ? ' ds-field--invalid' : ''}`}>
            <label className="ds-field__label" htmlFor="question-topic">
              Tema
            </label>
            <select
              id="question-topic"
              name="topic"
              className="ds-input"
              defaultValue={values.topic}
              key={section}
            >
              {(ASSESSMENT_TOPICS[section as keyof typeof ASSESSMENT_TOPICS] ?? []).map((topic) => (
                <option key={topic.key} value={topic.key}>
                  {topic.label}
                </option>
              ))}
            </select>
            {errors.topic && <p className="ds-field__error">{errors.topic}</p>}
          </div>
        </div>
        <TextField
          label="Subtema (opcional)"
          name="subtopic"
          defaultValue={values.subtopic}
          maxLength={80}
        />
        <div className="teacher-form__row">
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="question-type">
              Tipo de pregunta
            </label>
            <select
              id="question-type"
              name="type"
              className="ds-input"
              value={type}
              onChange={(event) => {
                const next = event.currentTarget.value as QuestionType;
                setType(next);
                setResponse(RESPONSE_KINDS_BY_TYPE[next][0]!);
              }}
            >
              {QUESTION_TYPES.map((entry) => (
                <option key={entry} value={entry}>
                  {QUESTION_TYPE_LABEL[entry]}
                </option>
              ))}
            </select>
          </div>
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="question-response">
              Forma de respuesta
            </label>
            <select
              id="question-response"
              name="response"
              className="ds-input"
              value={kind}
              onChange={(event) => setResponse(event.currentTarget.value as ResponseKind)}
              disabled={allowed.length === 1}
            >
              {allowed.map((entry) => (
                <option key={entry} value={entry}>
                  {KIND_LABEL[entry]}
                </option>
              ))}
            </select>
            {allowed.length === 1 && <input type="hidden" name="response" value={kind} />}
          </div>
        </div>
        <div className="teacher-form__row">
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="question-difficulty">
              Dificultad interna (no la ve el estudiante)
            </label>
            <select
              id="question-difficulty"
              name="difficulty"
              className="ds-input"
              defaultValue={String(values.difficulty)}
            >
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="Peso (opcional)"
            name="weight"
            inputMode="decimal"
            defaultValue={values.weight}
            hint="Vacío: según la dificultad (1 → 1, 3 → 1.5, 5 → 2)."
            error={errors.weight}
          />
        </div>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Enunciado</legend>
        <Textarea
          label="Enunciado"
          name="prompt"
          defaultValue={values.prompt}
          maxLength={2000}
          error={errors.prompt}
        />
        <Textarea
          label="Consulta SQL que se muestra (opcional)"
          name="code"
          defaultValue={values.code}
          maxLength={4000}
          rows={4}
          code
          error={errors.code}
        />
        <Textarea
          label="Tabla de origen (opcional)"
          name="exhibit_table"
          defaultValue={values.exhibitTable}
          maxLength={6000}
          rows={5}
          code
          hint="Primera línea: columnas separadas por |. Cada línea siguiente: una fila. NULL se escribe NULL."
          error={errors.exhibit_table}
        />
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Opciones ({KIND_LABEL[kind].toLowerCase()})</legend>
        {errors.options && <p className="ds-field__error">{errors.options}</p>}
        <p className="ds-field__hint">
          Escribe de 2 a 8 opciones; las vacías se ignoran. Usa distractores plausibles y explica en
          cada una qué confusión revela.
        </p>
        <ol className="option-editor">
          {options.map((option, index) => (
            <li key={index} className="option-editor__item">
              <Textarea
                label={`Opción ${index + 1}`}
                name={`option_${index}_body`}
                defaultValue={option?.body ?? ''}
                maxLength={2000}
                rows={2}
              />
              <div className="option-editor__row">
                <label className="teacher-check">
                  <input
                    type="checkbox"
                    name={`option_${index}_kind`}
                    value="code"
                    defaultChecked={option?.kind === 'code'}
                  />
                  Es código SQL
                </label>
                {kind === 'order' ? (
                  <TextField
                    label="Posición correcta"
                    name={`option_${index}_order`}
                    type="number"
                    min={1}
                    max={MAX_FORM_OPTIONS}
                    defaultValue={option?.order || ''}
                  />
                ) : (
                  <label className="teacher-check">
                    <input
                      type="checkbox"
                      name={`option_${index}_correct`}
                      defaultChecked={option?.correct ?? false}
                    />
                    Correcta
                  </label>
                )}
              </div>
              <TextField
                label={`Retroalimentación de la opción ${index + 1}`}
                name={`option_${index}_feedback`}
                defaultValue={option?.feedback ?? ''}
                maxLength={1000}
              />
            </li>
          ))}
        </ol>
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Retroalimentación</legend>
        <Textarea
          label="Por qué la respuesta correcta lo es"
          name="explanation"
          defaultValue={values.explanation}
          maxLength={2000}
        />
        <TextField
          label="Concepto relacionado"
          name="concept"
          defaultValue={values.concept}
          maxLength={200}
        />
        <TextField
          label="Qué debe revisar quien falle"
          name="review"
          defaultValue={values.review}
          maxLength={500}
        />
        <TextField
          label="Fuente académica o referencia"
          name="reference"
          defaultValue={values.reference}
          maxLength={500}
          hint="Documentación oficial de Oracle, Oracle Academy o una lección de DB LAB."
        />
        <TextField
          label="Etiquetas (separadas por comas)"
          name="tags"
          defaultValue={values.tags}
          maxLength={300}
        />
      </fieldset>

      <fieldset className="teacher-form__group">
        <legend>Estado</legend>
        <label className="teacher-check">
          <input
            type="radio"
            name="status"
            value="draft"
            defaultChecked={values.status === 'draft'}
          />
          Borrador (no se puede usar en evaluaciones)
        </label>
        <label className="teacher-check">
          <input
            type="radio"
            name="status"
            value="published"
            defaultChecked={values.status === 'published'}
          />
          Publicada (disponible para evaluaciones)
        </label>
      </fieldset>

      <div className="teacher-form__actions">
        <Button type="submit" pending={pending} pendingLabel="Guardando…">
          Guardar pregunta
        </Button>
      </div>
    </form>
  );
}
