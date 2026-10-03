import { describe, expect, it } from 'vitest';
import {
  canOpenTeacherArea,
  displayName,
  initials,
} from '@/features/accounts/application/account-api';
import {
  authErrorMessage,
  loginNotice,
  validateEmailOnly,
  validateNewPassword,
  validateProfileNames,
  validateSignIn,
  validateSignUp,
} from '@/features/accounts/application/auth-forms';
import { isPrivatePath, loginHref, safeNextPath } from '@/features/accounts/application/redirects';
import { cookieHasSessionHint } from '@/features/accounts/application/session-hint';

describe('Redirecciones después de iniciar sesión', () => {
  it('acepta solo rutas internas y conserva la consulta', () => {
    expect(safeNextPath('/learn/where?x=1#parte')).toBe('/learn/where?x=1');
    expect(safeNextPath('/teacher')).toBe('/teacher');
  });

  it.each([
    'https://malicioso.example/robar',
    '//malicioso.example',
    '/\\malicioso.example',
    'javascript:alert(1)',
    '/learn\u0000',
    '/learn\n',
    '',
    `/${'a'.repeat(400)}`,
  ])('rechaza «%s» (redirección abierta)', (value) => {
    expect(safeNextPath(value)).toBe('/dashboard');
  });

  it('no vuelve a las pantallas de acceso (bucle)', () => {
    for (const path of ['/login', '/register', '/forgot-password', '/auth/callback']) {
      expect(safeNextPath(path)).toBe('/dashboard');
    }
    expect(safeNextPath(42)).toBe('/dashboard');
  });

  it('clasifica las rutas privadas y arma el enlace de acceso', () => {
    expect(isPrivatePath('/dashboard')).toBe(true);
    expect(isPrivatePath('/teacher/grupo')).toBe(true);
    expect(isPrivatePath('/teachers')).toBe(false);
    expect(isPrivatePath('/learn')).toBe(false);
    expect(loginHref('/profile')).toBe('/login?next=%2Fprofile');
    expect(loginHref('//otro', 'no-disponible')).toBe('/login?aviso=no-disponible');
  });
});

describe('Validación de formularios', () => {
  const valid = {
    firstName: '  María José ',
    lastName: "D'Alessandro-Pérez",
    email: ' Maria@Ejemplo.COM ',
    password: 'clave2026',
    confirmPassword: 'clave2026',
  };

  it('normaliza un registro válido sin pedir más datos', () => {
    expect(validateSignUp(valid)).toEqual({
      ok: true,
      data: {
        firstName: 'María José',
        lastName: "D'Alessandro-Pérez",
        email: 'maria@ejemplo.com',
        password: 'clave2026',
      },
    });
  });

  it('marca cada campo con un mensaje claro', () => {
    const result = validateSignUp({
      firstName: '',
      lastName: 'R2D2',
      email: 'sin-arroba',
      password: 'corta',
      confirmPassword: 'otra',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors).toEqual({
      firstName: 'Escribe tu nombre.',
      lastName: 'El apellido solo admite letras, espacios, apóstrofos, puntos y guiones.',
      email: 'Escribe un correo válido, por ejemplo nombre@dominio.com.',
      password: 'Usa al menos 8 caracteres.',
      confirmPassword: 'Las contraseñas no coinciden.',
    });
  });

  it('exige letras y números, con un máximo compatible con Auth', () => {
    const letters = validateNewPassword({
      password: 'solamenteletras',
      confirmPassword: 'solamenteletras',
    });
    expect(letters.ok ? '' : letters.fieldErrors.password).toBe('Combina letras y números.');
    const long = validateNewPassword({ password: `a1${'x'.repeat(80)}`, confirmPassword: '' });
    expect(long.ok ? '' : long.fieldErrors.password).toMatch(/como máximo 72/);
  });

  it('el acceso no aplica las reglas de creación y no acepta tipos inesperados', () => {
    expect(validateSignIn({ email: 'a@b.co', password: 'x' }).ok).toBe(true);
    expect(validateSignIn({ email: ['a@b.co'], password: { x: 1 } }).ok).toBe(false);
    expect(validateEmailOnly({ email: 'a@b.co' }).ok).toBe(true);
    expect(validateProfileNames({ firstName: 'Ana', lastName: '' }).ok).toBe(false);
  });

  it('los mensajes de error no revelan si una cuenta existe', () => {
    expect(authErrorMessage('invalid_credentials', 'sign-in')).toBe(
      'Correo o contraseña incorrectos.',
    );
    expect(authErrorMessage('user_not_found', 'sign-in')).not.toMatch(/no existe/i);
    expect(authErrorMessage(undefined, 'oauth')).toMatch(/Microsoft/);
    expect(authErrorMessage('network', 'sign-in')).toMatch(/conexión/);
  });

  it('solo muestra avisos conocidos de la URL', () => {
    expect(loginNotice('enlace-caducado')?.tone).toBe('warning');
    expect(loginNotice('<script>')).toBeNull();
    expect(loginNotice('toString')).toBeNull();
  });
});

describe('Cuenta y rol', () => {
  it('iniciales y nombre visible', () => {
    expect(initials({ firstName: 'ángela', lastName: 'Ruiz', email: 'a@b.co' })).toBe('ÁR');
    expect(initials({ firstName: '', lastName: '', email: 'zoe@b.co' })).toBe('Z');
    expect(displayName({ firstName: '', lastName: '', email: 'zoe@b.co' })).toBe('zoe');
  });

  it('solo el rol teacher abre el panel docente', () => {
    expect(canOpenTeacherArea('teacher')).toBe(true);
    expect(canOpenTeacherArea('student')).toBe(false);
    expect(canOpenTeacherArea(null)).toBe(false);
  });

  it('la marca de sesión se reconoce sin leer tokens', () => {
    expect(cookieHasSessionHint('a=1; dblab-session=1; b=2')).toBe(true);
    expect(cookieHasSessionHint('dblab-session=0')).toBe(false);
    expect(cookieHasSessionHint('')).toBe(false);
  });
});
