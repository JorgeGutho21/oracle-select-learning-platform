// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  analyzeLabQuery,
  diagnosticGroup,
  explainQuery,
  type LabDiagnostic,
} from '@/features/laboratory/application/lab-api';

/** Primer diagnóstico (errores antes que avisos) de una consulta. */
function first(sql: string): LabDiagnostic {
  const { diagnostics } = analyzeLabQuery(sql);
  const item =
    diagnostics.find(({ severity }) => severity === 'error') ??
    diagnostics.find(({ severity }) => severity === 'warning');
  if (!item) throw new Error(`Sin diagnóstico: ${sql}`);
  return item;
}

describe('Diagnóstico pedagógico del laboratorio (casos del encargo)', () => {
  it('coma faltante: advertencia con fragmento y corrección', () => {
    const item = first('SELECT nombre salario FROM empleados;');
    expect(item).toMatchObject({
      group: 'ADVERTENCIA',
      code: 'possible-missing-comma',
      line: 1,
      column: 15,
      found: 'SELECT nombre salario FROM empleados;',
      correction: 'SELECT nombre, salario FROM empleados;',
    });
    expect(item.example).toContain('SELECT nombre, salario');
    expect(item.fixedSql).toBe('SELECT nombre, salario FROM empleados;');
  });

  it('coma sobrante antes de FROM', () => {
    expect(first('SELECT nombre, FROM empleados;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'missing-item-after-comma',
      correction: 'SELECT nombre FROM empleados;',
    });
  });

  it('FROM faltante cuando la tabla quedó como alias', () => {
    expect(first('SELECT nombre empleados;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'missing-from',
      correction: 'SELECT nombre FROM empleados;',
    });
  });

  it('SELECT faltante: propone escribirlo antes de la lista de columnas', () => {
    expect(first('nombre, salario FROM empleados;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'missing-select',
      line: 1,
      column: 1,
      correction: 'SELECT nombre, salario FROM empleados;',
      fixedSql: 'SELECT nombre, salario FROM empleados;',
    });
    // Sin lista de columnas no se inventa una: solo se explica.
    expect(first('FROM empleados;')).toMatchObject({ code: 'missing-select', correction: null });
  });

  it('lista de columnas vacía y tabla ausente', () => {
    expect(first('SELECT FROM empleados;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'empty-select-list',
    });
    expect(first('SELECT nombre FROM;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'missing-table',
      correction: 'SELECT nombre FROM empleados;',
    });
  });

  it('texto sin comillas en WHERE', () => {
    const item = first('SELECT nombre\nFROM empleados\nWHERE ciudad = Bogotá;');
    expect(item).toMatchObject({
      group: 'SINTAXIS',
      code: 'unquoted-text',
      line: 3,
      column: 16,
      found: 'WHERE ciudad = Bogotá;',
      correction: "WHERE ciudad = 'Bogotá';",
    });
  });

  it('= NULL: advertencia con la forma correcta IS NULL', () => {
    const analysis = analyzeLabQuery('SELECT nombre\nFROM empleados\nWHERE bono = NULL;');
    expect(analysis.status).toBe('valid');
    expect(analysis.preview?.rows).toHaveLength(0);
    expect(first('SELECT nombre\nFROM empleados\nWHERE bono = NULL;')).toMatchObject({
      group: 'ADVERTENCIA',
      code: 'equals-null',
      found: 'WHERE bono = NULL;',
      correction: 'WHERE bono IS NULL;',
    });
  });

  it('BETWEEN con los límites al revés', () => {
    expect(
      first('SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;'),
    ).toMatchObject({
      group: 'ADVERTENCIA',
      code: 'between-reversed',
      correction: 'WHERE salario BETWEEN 3000000 AND 6000000;',
    });
  });

  it('IN sin paréntesis', () => {
    expect(first("SELECT nombre\nFROM empleados\nWHERE ciudad IN 'Bogotá', 'Cali';")).toMatchObject(
      {
        group: 'SINTAXIS',
        code: 'in-without-parentheses',
        correction: "WHERE ciudad IN ('Bogotá', 'Cali');",
      },
    );
  });

  it('patrón de LIKE sin comillas', () => {
    expect(first('SELECT nombre\nFROM empleados\nWHERE nombre LIKE A%;')).toMatchObject({
      group: 'SINTAXIS',
      code: 'like-unquoted-pattern',
      correction: "WHERE nombre LIKE 'A%';",
    });
  });

  it('AND y OR sin paréntesis: explica cómo lo lee Oracle', () => {
    const item = first(
      "SELECT nombre\nFROM empleados\nWHERE estado = 'ACTIVO' OR departamento = 'TI' AND salario > 5000000;",
    );
    expect(item).toMatchObject({ group: 'ADVERTENCIA', code: 'and-or-precedence' });
    expect(item.message).toContain(
      "estado = 'ACTIVO' OR (departamento = 'TI' AND salario > 5000000)",
    );
  });

  it('columna y tabla inexistentes con sugerencia', () => {
    expect(first('SELECT sueldo FROM empleados')).toMatchObject({
      group: 'SEMÁNTICA',
      code: 'unknown-column',
    });
    expect(first('SELECT salarios FROM empleados')).toMatchObject({
      correction: 'SELECT salario FROM empleados',
    });
    expect(first('SELECT * FROM usuarios')).toMatchObject({
      group: 'SEMÁNTICA',
      code: 'unknown-table',
      correction: 'SELECT * FROM empleados',
    });
  });

  it('alias inválido y alias en WHERE', () => {
    expect(first('SELECT salario * 12 AS salario anual FROM empleados')).toMatchObject({
      code: 'invalid-alias',
      correction: 'SELECT salario * 12 AS salario_anual FROM empleados',
    });
    expect(
      first('SELECT nombre, salario * 12 AS anual\nFROM empleados\nWHERE anual > 60000000'),
    ).toMatchObject({ group: 'ORACLE', code: 'alias-in-where' });
  });

  it('ORDER BY: palabra BY olvidada y DISTINCT con criterio no seleccionado', () => {
    expect(first('SELECT nombre FROM empleados ORDER salario')).toMatchObject({
      group: 'SINTAXIS',
      correction: 'SELECT nombre FROM empleados ORDER BY salario',
    });
    expect(first('SELECT DISTINCT ciudad FROM empleados ORDER BY salario')).toMatchObject({
      group: 'ORACLE',
      code: 'order-by-not-selected',
    });
  });

  it('mayúsculas y tildes que dejan el resultado vacío', () => {
    expect(first("SELECT nombre FROM empleados WHERE ciudad = 'bogota'")).toMatchObject({
      group: 'ADVERTENCIA',
      code: 'text-case',
      correction: "SELECT nombre FROM empleados WHERE ciudad = 'Bogotá'",
    });
    expect(first("SELECT nombre FROM empleados WHERE nombre LIKE 'a%'")).toMatchObject({
      code: 'text-case',
    });
  });

  it('una construcción futura es válida en Oracle y enlaza con su ficha', () => {
    const join = first('SELECT nombre FROM empleados JOIN departamentos ON 1 = 1');
    expect(join.group).toBe('ALCANCE EDUCATIVO');
    expect(join.message).toContain('es SQL válido en Oracle');
    expect(join.message).not.toMatch(/no existe/);
    expect(join.learnMore).toEqual({
      label: 'INNER JOIN · Nivel 4',
      href: '/modules#tema-inner-join',
    });
    expect(first('SELECT UPPER(nombre) FROM empleados').learnMore?.href).toBe(
      '/modules#tema-upper',
    );
    expect(first('DELETE FROM empleados').learnMore?.href).toBe('/modules#tema-delete');
  });

  it('agrupa por severidad y categoría en los cinco grupos visibles', () => {
    expect(diagnosticGroup({ severity: 'warning', category: 'syntax' })).toBe('ADVERTENCIA');
    expect(diagnosticGroup({ severity: 'error', category: 'syntax' })).toBe('SINTAXIS');
    expect(diagnosticGroup({ severity: 'error', category: 'identifier' })).toBe('SEMÁNTICA');
    expect(diagnosticGroup({ severity: 'error', category: 'scope' })).toBe('ALCANCE EDUCATIVO');
    expect(diagnosticGroup({ severity: 'error', category: 'security' })).toBe('ALCANCE EDUCATIVO');
    expect(diagnosticGroup({ severity: 'error', category: 'oracle' })).toBe('ORACLE');
  });
});

describe('Vista tabla → consulta → resultado', () => {
  it('marca filas que cumplen, descartadas y desconocidas por NULL', () => {
    const flow = explainQuery('SELECT nombre FROM empleados WHERE bono > 300000');
    const states = flow.source.rowStates ?? [];
    expect(states).toHaveLength(20);
    expect(states.filter((state) => state === 'unknown')).toHaveLength(6);
    expect(states.filter((state) => state === 'kept')).toHaveLength(flow.counts.kept);
    expect(flow.source.columns.map(({ name }) => name)).toEqual(['NOMBRE', 'BONO']);
  });

  it('recorta la vista a un máximo de filas y conserva el total', () => {
    const flow = explainQuery("SELECT nombre, ciudad FROM empleados WHERE ciudad = 'Cali'", {
      maxRows: 8,
    });
    expect(flow.source.rows).toHaveLength(8);
    expect(flow.source.totalRows).toBe(20);
    expect(flow.source.rowStates?.filter((state) => state === 'kept')).toHaveLength(5);
    expect(flow.result?.rows).toHaveLength(5);
  });

  it('DISTINCT muestra el resultado antes de quitar repetidas', () => {
    const flow = explainQuery('SELECT DISTINCT ciudad FROM empleados');
    expect(flow.beforeDistinct?.rows).toHaveLength(20);
    expect(flow.beforeDistinct?.duplicateRows).toHaveLength(15);
    expect(flow.result?.rows).toHaveLength(5);
  });

  it('ORDER BY indica las columnas ordenadas del resultado', () => {
    const flow = explainQuery(
      'SELECT departamento, nombre, salario FROM empleados ORDER BY 1, 3 DESC',
    );
    expect(flow.result?.sortedBy).toEqual([
      { column: 0, direction: 'ASC' },
      { column: 2, direction: 'DESC' },
    ]);
  });
});
