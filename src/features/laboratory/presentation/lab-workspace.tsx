'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { SqlEditor, type EditorDiagnostic } from '@/presentation/components/editor/sql-editor';
import { Alert, Button, Chip, CodeBlock, Dialog } from '@/presentation/components/ui';
import type { LabDraftRepository } from '../application/lab-draft';
import {
  analyzeLabQuery,
  DEFAULT_LAB_SQL,
  LAB_EXAMPLE_GROUPS,
  LAB_EXAMPLES,
  type LabAnalysis,
  type OracleServiceStatus,
} from '../application/lab-api';
import type { LabExecution } from '../application/execute-on-oracle';
import {
  AnatomyPanel,
  FeedbackPanel,
  Panel,
  ResultPanel,
  SchemaPanel,
  TranslationPanel,
} from './lab-panels';

export interface LaboratoryWorkspaceProps {
  /** Ejecución real: se compone en el servidor con el adaptador Oracle vigente. */
  execute: (sql: string) => Promise<LabExecution>;
  loadStatus: () => Promise<OracleServiceStatus>;
  repository: LabDraftRepository;
  incomingSql: string | null;
  returnTo: string | null;
}

/**
 * Laboratorio SQL (LAB_SPEC). «Analizar» es el análisis educativo con el motor del curso;
 * «Ejecutar en Oracle» es una operación distinta que nunca se sustituye por una simulación.
 */
export function LaboratoryWorkspace({
  execute,
  loadStatus,
  repository,
  incomingSql,
  returnTo,
}: LaboratoryWorkspaceProps) {
  const helpId = useId();
  const [sql, setSql] = useState(DEFAULT_LAB_SQL);
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [oracleStatus, setOracleStatus] = useState<OracleServiceStatus | null>(null);
  const [execution, setExecution] = useState<{ sql: string; result: LabExecution } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [replacement, setReplacement] = useState<{ sql: string; title: string } | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((draft) => {
        if (!active) return;
        const saved = draft ?? DEFAULT_LAB_SQL;
        if (incomingSql && saved !== DEFAULT_LAB_SQL && saved !== incomingSql) {
          setSql(saved);
          setReplacement({ sql: incomingSql, title: '¿Cargar el ejemplo en tu editor?' });
        } else setSql(incomingSql ?? saved);
        setDraftReady(true);
      })
      .catch(() => {
        if (!active) return;
        setSql(incomingSql ?? DEFAULT_LAB_SQL);
        setStorageError(true);
        setDraftReady(true);
      });
    return () => {
      active = false;
    };
  }, [repository, incomingSql]);

  useEffect(() => {
    if (draftReady && !storageError) void repository.save(sql).catch(() => setStorageError(true));
  }, [repository, sql, draftReady, storageError]);

  const replaceSql = (nextSql: string) => {
    setSql(nextSql);
    setAnalysis(null);
    setExecution(null);
    setReplacement(null);
  };

  const requestReplacement = (nextSql: string, title: string) => {
    if (sql !== DEFAULT_LAB_SQL && sql !== nextSql) setReplacement({ sql: nextSql, title });
    else replaceSql(nextSql);
  };

  useEffect(() => {
    let active = true;
    loadStatus()
      .then((status) => active && setOracleStatus(status))
      .catch(() => active && setStatusError(true));
    return () => {
      active = false;
    };
  }, [loadStatus]);

  const stale = analysis !== null && analysis.source !== sql;
  const editorDiagnostics = useMemo<EditorDiagnostic[]>(
    () =>
      analysis && !stale
        ? analysis.diagnostics.map(({ from, to, severity, message }) => ({
            from,
            to,
            severity,
            message,
          }))
        : [],
    [analysis, stale],
  );

  const analyze = () => setAnalysis(analyzeLabQuery(sql));

  const runOnOracle = async () => {
    const current = sql;
    setAnalysis(analyzeLabQuery(current));
    setExecuting(true);
    try {
      setExecution({ sql: current, result: await execute(current) });
    } catch {
      setExecution({
        sql: current,
        result: {
          status: 'unavailable',
          reason: 'unreachable',
          message:
            'No se pudo contactar con el servicio de ejecución. Tu consulta se conserva en el editor.',
        },
      });
    } finally {
      setExecuting(false);
    }
  };

  const loadExample = (value: string) => {
    const example = LAB_EXAMPLES.find((item) => item.id === value);
    if (example) requestReplacement(example.sql, '¿Sustituir tu consulta por este ejemplo?');
  };

  return (
    <div className="site-container feature-page lab-page">
      <header className="feature-heading">
        <span className="eyebrow">Practicar</span>
        <h1>Laboratorio SQL</h1>
        <p className="readable muted">
          Escribe consultas SELECT sobre la tabla EMPLEADOS, con WHERE, ORDER BY y sus operadores.
          El diagnóstico señala dónde está cada problema y cómo corregirlo; la ejecución real se
          hace en Oracle.
        </p>
      </header>

      {returnTo && (
        <Link href={returnTo as Route} className="inline-action lab-return">
          ← Volver {returnTo.startsWith('/presentation') ? 'a la escena' : 'a la lección'}
        </Link>
      )}
      {storageError && (
        <Alert tone="warning" title="El borrador no se guardará al cerrar">
          Puedes seguir trabajando en el editor. Copia tu consulta antes de salir.
        </Alert>
      )}

      {statusError && (
        <Alert tone="warning" title="Estado de Oracle desconocido">
          No se pudo consultar el estado del servicio de ejecución.
        </Alert>
      )}

      <div className="lab-grid">
        <SchemaPanel
          highlighted={
            analysis && !stale ? [...analysis.sourceColumns, ...analysis.conditionColumns] : []
          }
        />

        <Panel
          id="lab-editor"
          number={2}
          title="Editor SQL"
          aside={stale ? <Chip tone="warning">Sin analizar</Chip> : null}
        >
          <div className="lab-examples">
            <label htmlFor="lab-example">Cargar un ejemplo</label>
            <select
              id="lab-example"
              className="lab-select"
              defaultValue=""
              // Hasta leer el borrador guardado: si no, su carga pisaría el ejemplo elegido.
              disabled={!draftReady}
              onChange={(event) => {
                loadExample(event.target.value);
                event.target.value = '';
              }}
            >
              <option value="" disabled>
                Elige un ejemplo…
              </option>
              {LAB_EXAMPLE_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {LAB_EXAMPLES.filter((example) => example.group === group).map((example) => (
                    <option key={example.id} value={example.id}>
                      {example.id} · {example.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <SqlEditor
            value={sql}
            onChange={setSql}
            onSubmit={analyze}
            label="Consulta SQL"
            describedBy={helpId}
            diagnostics={editorDiagnostics}
            readOnly={!draftReady}
          />
          <p id={helpId} className="lab-muted">
            Ctrl+Enter (Cmd+Enter en Mac) analiza la consulta. Tab sale del editor.
          </p>
          <div className="lab-actions">
            <Button onClick={analyze} disabled={!draftReady}>
              Analizar
            </Button>
            <Button
              variant="secondary"
              onClick={runOnOracle}
              pending={executing}
              pendingLabel="Ejecutando en Oracle…"
              disabled={!draftReady}
            >
              Ejecutar en Oracle
            </Button>
            <Button
              variant="text"
              disabled={!draftReady}
              onClick={() =>
                requestReplacement(DEFAULT_LAB_SQL, '¿Restablecer el ejemplo inicial?')
              }
            >
              Restablecer ejemplo
            </Button>
          </div>
        </Panel>

        <FeedbackPanel
          analysis={analysis}
          stale={stale}
          onApply={(fixed) => {
            setSql(fixed);
            setAnalysis(analyzeLabQuery(fixed));
          }}
        />
        <ResultPanel
          analysis={analysis}
          stale={stale}
          oracleStatus={oracleStatus}
          execution={execution}
          executing={executing}
        />
        <TranslationPanel analysis={analysis} stale={stale} />
        <AnatomyPanel analysis={analysis} stale={stale} />
      </div>
      <Dialog
        open={replacement !== null}
        onClose={() => setReplacement(null)}
        title={replacement?.title ?? 'Sustituir consulta'}
        description="Tienes un borrador distinto. Puedes conservarlo o sustituirlo por el ejemplo que se muestra abajo."
      >
        {replacement && <CodeBlock code={replacement.sql} label="Consulta que se cargará" />}
        <div className="lab-actions">
          <Button variant="secondary" onClick={() => setReplacement(null)}>
            Conservar mi borrador
          </Button>
          <Button
            onClick={() => {
              if (replacement) replaceSql(replacement.sql);
            }}
          >
            Cargar ejemplo
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
