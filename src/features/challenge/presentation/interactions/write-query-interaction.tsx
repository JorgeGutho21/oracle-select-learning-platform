'use client';

import dynamic from 'next/dynamic';
import { useId, useMemo, useState } from 'react';
import { Alert, Button, LoadingState } from '@/presentation/components/ui';
import { checkSql, type SqlCheckItem } from '../../application/challenge-api';
import type { InteractionProps } from './types';

// CodeMirror se descarga solo al abrir M10, no con el resto del Challenge.
const SqlEditor = dynamic(
  () => import('@/presentation/components/editor/sql-editor').then((module) => module.SqlEditor),
  { ssr: false, loading: () => <LoadingState label="Cargando el editor SQL…" /> },
);

/**
 * M10: consulta escrita en un editor vacío. «Revisar sintaxis» usa el motor SQL compartido
 * sin puntuar. El envío se corrige en el servidor: estructura y requisitos con el mismo
 * motor, y salida real en Oracle, que no se simula.
 */
export function WriteQueryInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'write-query'>) {
  const helpId = useId();
  const [check, setCheck] = useState<{
    sql: string;
    items: readonly SqlCheckItem[];
    valid: boolean;
  } | null>(null);
  const current = check && check.sql === answer.sql ? check : null;
  const diagnostics = useMemo(
    () =>
      current
        ? current.items.map(({ from, to, severity, message }) => ({ from, to, severity, message }))
        : [],
    [current],
  );
  const review = () => setCheck({ sql: answer.sql, ...checkSql(answer.sql) });

  return (
    <div className="ch-stack">
      <Alert tone="info" title="Corrección con Oracle">
        {mission.publicData.requirement} Mientras el servicio Oracle no esté disponible, un envío
        con la estructura correcta no consume intento; un error de SQL sí lo consume.
      </Alert>
      <SqlEditor
        value={answer.sql}
        onChange={(sql) => onChange({ type: 'write-query', sql })}
        onSubmit={review}
        label="Tu consulta para el reto final"
        describedBy={helpId}
        diagnostics={diagnostics}
        readOnly={disabled}
        placeholderText="Escribe tu consulta desde cero…"
      />
      <p id={helpId} className="ch-muted">
        Ctrl+Enter revisa la sintaxis sin puntuar. Tab sale del editor.
      </p>
      <div className="ch-actions">
        <Button
          variant="secondary"
          onClick={review}
          disabled={disabled || answer.sql.trim() === ''}
        >
          Revisar sintaxis (sin puntuar)
        </Button>
      </div>
      <div aria-live="polite" className="ch-stack">
        {current?.valid && current.items.length === 0 && (
          <Alert tone="success" title="Sintaxis válida">
            La consulta pertenece al subconjunto SELECT. Envíala para evaluar el pedido completo.
          </Alert>
        )}
        {current?.items.map((item, index) => (
          <Alert
            key={`${item.from}-${index}`}
            tone={item.severity === 'error' ? 'danger' : 'warning'}
            title={`Línea ${item.line}, columna ${item.column}`}
          >
            {item.message} {item.hint}
          </Alert>
        ))}
      </div>
    </div>
  );
}
