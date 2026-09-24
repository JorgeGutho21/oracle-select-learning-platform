'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { SqlEditor, type EditorDiagnostic } from '@/presentation/components/editor/sql-editor';
import { Alert, Button, Chip } from '@/presentation/components/ui';
import {
  analyzeLabQuery,
  DEFAULT_LAB_SQL,
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
}

/**
 * Laboratorio SQL (LAB_SPEC). «Analizar» es el análisis educativo con el motor del curso;
 * «Ejecutar en Oracle» es una operación distinta que nunca se sustituye por una simulación.
 */
export function LaboratoryWorkspace({ execute, loadStatus }: LaboratoryWorkspaceProps) {
  const helpId = useId();
  const [sql, setSql] = useState(DEFAULT_LAB_SQL);
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [oracleStatus, setOracleStatus] = useState<OracleServiceStatus | null>(null);
  const [execution, setExecution] = useState<{ sql: string; result: LabExecution } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [statusError, setStatusError] = useState(false);

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
    if (example) setSql(example.sql);
  };

  return (
    <div className="site-container feature-page lab-page">
      <header className="feature-heading">
        <span className="eyebrow">Practicar</span>
        <h1>Laboratorio SQL</h1>
        <p className="readable muted">
          Escribe consultas SELECT sobre la tabla EMPLEADOS. El análisis educativo explica tu
          consulta paso a paso; la ejecución real necesita el servicio Oracle.
        </p>
      </header>

      {statusError && (
        <Alert tone="warning" title="Estado de Oracle desconocido">
          No se pudo consultar el estado del servicio de ejecución.
        </Alert>
      )}

      <div className="lab-grid">
        <SchemaPanel highlighted={analysis && !stale ? analysis.sourceColumns : []} />

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
              onChange={(event) => {
                loadExample(event.target.value);
                event.target.value = '';
              }}
            >
              <option value="" disabled>
                Elige un ejemplo…
              </option>
              {LAB_EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.id} · {example.title}
                </option>
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
          />
          <p id={helpId} className="lab-muted">
            Ctrl+Enter (Cmd+Enter en Mac) analiza la consulta. Tab sale del editor.
          </p>
          <div className="lab-actions">
            <Button onClick={analyze}>Analizar</Button>
            <Button
              variant="secondary"
              onClick={runOnOracle}
              pending={executing}
              pendingLabel="Ejecutando en Oracle…"
            >
              Ejecutar en Oracle
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setSql(DEFAULT_LAB_SQL);
                setAnalysis(null);
                setExecution(null);
              }}
            >
              Restablecer ejemplo
            </Button>
          </div>
        </Panel>

        <FeedbackPanel analysis={analysis} stale={stale} />
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
    </div>
  );
}
