'use client';

import Link from 'next/link';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  confirmationError,
  emailError,
  INITIAL_FORM_STATE,
  nameError,
  passwordError,
  PASSWORD_MIN,
  type AuthField,
  type AuthFormState,
  type FieldErrors,
} from '../application/auth-forms';
import { Alert, Button } from '@/presentation/components/ui';
import { PasswordField, TextField } from '@/presentation/components/ui/text-field';

/**
 * Formularios de cuenta. La validación local ayuda al salir de cada campo; la que decide
 * es la del servidor. Tras un error recuperable los datos no sensibles se conservan y el
 * foco va al resumen, que se anuncia a los lectores de pantalla.
 */

export type FormAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;

type Validator = (form: HTMLFormElement) => string | undefined;

function value(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement ? field.value : '';
}

const VALIDATORS: Readonly<Record<AuthField, Validator>> = {
  firstName: (form) => nameError(value(form, 'firstName'), 'nombre'),
  lastName: (form) => nameError(value(form, 'lastName'), 'apellido'),
  email: (form) => emailError(value(form, 'email')),
  password: (form) => passwordError(value(form, 'password')),
  confirmPassword: (form) =>
    confirmationError(value(form, 'password'), value(form, 'confirmPassword')),
};

/**
 * Errores del servidor, revisados mientras se corrige: un error ya mostrado se actualiza o
 * desaparece al escribir. Los errores nuevos solo aparecen al enviar, así el formulario no
 * se mueve bajo el cursor (un error insertado al salir del campo desplazaba el botón).
 */
function useFieldErrors(state: AuthFormState, strictPassword: boolean) {
  const [local, setLocal] = useState<Partial<Record<AuthField, string | null>>>({});
  const [lastState, setLastState] = useState(state);
  if (lastState !== state) {
    setLastState(state);
    setLocal({});
  }
  const errors: FieldErrors = {};
  for (const name of Object.keys(VALIDATORS) as AuthField[]) {
    const revised = local[name];
    const message = revised === undefined ? state.fieldErrors[name] : revised;
    if (message) errors[name] = message;
  }
  const revise = (form: HTMLFormElement, name: AuthField) => {
    if (!errors[name] || (name === 'password' && !strictPassword)) return;
    const message = VALIDATORS[name](form);
    setLocal((current) => ({ ...current, [name]: message ?? null }));
  };
  const check = (form: HTMLFormElement, name: AuthField) => {
    revise(form, name);
    if (name === 'password') revise(form, 'confirmPassword');
  };
  return { errors, check };
}

function FormSummary({
  state,
  children,
}: {
  readonly state: AuthFormState;
  readonly children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== 'idle') ref.current?.focus();
  }, [state]);
  // El resumen recibe el foco y se anuncia: error como alerta, éxito como estado.
  return (
    <div ref={ref} tabIndex={-1} className="auth-summary">
      {state.status === 'error' && (
        <Alert tone="danger" title={state.message} live>
          {children}
        </Alert>
      )}
      {state.status === 'success' && <Alert tone="success" title={state.message} live />}
    </div>
  );
}

function changeHandler(check: (form: HTMLFormElement, name: AuthField) => void) {
  return (event: ChangeEvent<HTMLFormElement>) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name in VALIDATORS) {
      check(event.currentTarget, target.name as AuthField);
    }
  };
}

export function SignInForm({
  action,
  next,
  resendAction,
}: {
  readonly action: FormAction;
  readonly next: string;
  readonly resendAction: FormAction;
}) {
  const [state, submit, pending] = useActionState(action, INITIAL_FORM_STATE);
  const { errors, check } = useFieldErrors(state, false);
  return (
    <>
      <FormSummary state={state}>
        {state.offer === 'resend-confirmation' && (
          <ResendConfirmation action={resendAction} email={state.values.email ?? ''} />
        )}
      </FormSummary>
      <form className="auth-form" action={submit} noValidate onChange={changeHandler(check)}>
        <input type="hidden" name="next" value={next} />
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values.email}
          error={errors.email}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <p className="auth-form__aside">
          <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <Button
          type="submit"
          pending={pending}
          pendingLabel="Iniciando sesión…"
          className="auth-form__submit"
        >
          Iniciar sesión
        </Button>
      </form>
    </>
  );
}

function ResendConfirmation({
  action,
  email,
}: {
  readonly action: FormAction;
  readonly email: string;
}) {
  const [state, submit, pending] = useActionState(action, INITIAL_FORM_STATE);
  return (
    <form action={submit} className="auth-inline-form">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="secondary" pending={pending} pendingLabel="Enviando…">
        Enviar otro enlace de confirmación
      </Button>
      {state.status !== 'idle' && (
        <p className="auth-inline-form__status" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SignUpForm({ action }: { readonly action: FormAction }) {
  const [state, submit, pending] = useActionState(action, INITIAL_FORM_STATE);
  const { errors, check } = useFieldErrors(state, true);
  if (state.status === 'success') {
    return (
      <div className="auth-done">
        <FormSummary state={state} />
        <p>
          Cuando confirmes el correo podrás <Link href="/login">iniciar sesión</Link>. Mientras
          tanto, puedes seguir estudiando como invitado.
        </p>
      </div>
    );
  }
  return (
    <>
      <FormSummary state={state} />
      <form className="auth-form" action={submit} noValidate onChange={changeHandler(check)}>
        <div className="auth-form__row">
          <TextField
            label="Nombre"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={60}
            defaultValue={state.values.firstName}
            error={errors.firstName}
          />
          <TextField
            label="Apellido"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={60}
            defaultValue={state.values.lastName}
            error={errors.lastName}
          />
        </div>
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values.email}
          error={errors.email}
          hint="Si tienes correo institucional, úsalo: así tu cuenta queda reconocida."
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={errors.password}
          hint={`Al menos ${PASSWORD_MIN} caracteres, con letras y números.`}
        />
        <PasswordField
          label="Confirmar contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
        <Button
          type="submit"
          pending={pending}
          pendingLabel="Creando la cuenta…"
          className="auth-form__submit"
        >
          Crear cuenta
        </Button>
      </form>
    </>
  );
}

export function ForgotPasswordForm({ action }: { readonly action: FormAction }) {
  const [state, submit, pending] = useActionState(action, INITIAL_FORM_STATE);
  const { errors, check } = useFieldErrors(state, false);
  return (
    <>
      <FormSummary state={state} />
      {state.status !== 'success' && (
        <form className="auth-form" action={submit} noValidate onChange={changeHandler(check)}>
          <TextField
            label="Correo de tu cuenta"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values.email}
            error={errors.email}
          />
          <Button
            type="submit"
            pending={pending}
            pendingLabel="Enviando…"
            className="auth-form__submit"
          >
            Enviar enlace
          </Button>
        </form>
      )}
    </>
  );
}

export function NewPasswordForm({ action }: { readonly action: FormAction }) {
  const [state, submit, pending] = useActionState(action, INITIAL_FORM_STATE);
  const { errors, check } = useFieldErrors(state, true);
  return (
    <>
      <FormSummary state={state} />
      <form className="auth-form" action={submit} noValidate onChange={changeHandler(check)}>
        <PasswordField
          label="Contraseña nueva"
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={errors.password}
          hint={`Al menos ${PASSWORD_MIN} caracteres, con letras y números.`}
        />
        <PasswordField
          label="Confirmar contraseña nueva"
          name="confirmPassword"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
        <Button
          type="submit"
          pending={pending}
          pendingLabel="Guardando…"
          className="auth-form__submit"
        >
          Guardar contraseña
        </Button>
      </form>
    </>
  );
}

export function ProfileForm({
  action,
  firstName,
  lastName,
}: {
  readonly action: FormAction;
  readonly firstName: string;
  readonly lastName: string;
}) {
  const [state, submit, pending] = useActionState(action, {
    ...INITIAL_FORM_STATE,
    values: { firstName, lastName },
  });
  const { errors, check } = useFieldErrors(state, false);
  return (
    <>
      <FormSummary state={state} />
      <form className="auth-form" action={submit} noValidate onChange={changeHandler(check)}>
        <div className="auth-form__row">
          <TextField
            label="Nombre"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={60}
            defaultValue={state.values.firstName}
            error={errors.firstName}
            key={`first-${state.values.firstName ?? ''}`}
          />
          <TextField
            label="Apellido"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={60}
            defaultValue={state.values.lastName}
            error={errors.lastName}
            key={`last-${state.values.lastName ?? ''}`}
          />
        </div>
        <Button
          type="submit"
          pending={pending}
          pendingLabel="Guardando…"
          className="auth-form__submit auth-form__submit--auto"
        >
          Guardar cambios
        </Button>
      </form>
    </>
  );
}
