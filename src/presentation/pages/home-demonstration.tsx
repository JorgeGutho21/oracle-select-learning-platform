'use client';

import { useState } from 'react';
import { EMPLEADOS, analyzeLabQuery } from '@/features/laboratory/application/lab-api';
import { Button } from '@/presentation/components/ui';

/** La demostración deriva las filas del dataset compartido. No ejecuta Oracle. */
export function HomeDemonstration() {
  const [withSalary, setWithSalary] = useState(false);
  const sql = `SELECT nombre, ${withSalary ? 'salario' : 'ciudad'} FROM empleados;`;
  const preview = analyzeLabQuery(sql).preview;
  return (
    <div className="home-demo" aria-label="Demostración de selección de columnas">
      <div className="home-demo-bar">
        <span className="home-demo-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>EMPLEADOS · {EMPLEADOS.rows.length} registros</span>
      </div>
      <div className="home-demo-query">
        <code>
          <b>SELECT</b> nombre, {withSalary ? 'salario' : 'ciudad'}
          <br />
          <b>FROM</b> empleados;
        </code>
      </div>
      <div className="home-demo-columns" aria-label="Columnas de la tabla original">
        {EMPLEADOS.columns.map(({ name }) => (
          <span
            key={name}
            data-selected={name === 'NOMBRE' || name === (withSalary ? 'SALARIO' : 'CIUDAD')}
          >
            {name}
          </span>
        ))}
      </div>
      <div className="home-demo-arrow">
        <span aria-hidden="true">↓</span> Eliges columnas. Conservas las filas.
      </div>
      <div
        className="home-demo-table"
        tabIndex={0}
        role="region"
        aria-label="Resultado de la demostración, desplazable"
      >
        <table>
          <caption>Vista educativa · {preview?.rows.length} filas, 2 columnas</caption>
          <thead>
            <tr>
              {preview?.columns.map(({ name }, index) => (
                <th key={`${name}-${index}`} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview?.rows.map((row, index) => (
              <tr key={index}>
                {row.map((value, cell) => (
                  <td key={cell}>
                    {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="secondary"
        aria-pressed={withSalary}
        onClick={() => setWithSalary(!withSalary)}
      >
        {withSalary ? 'Mostrar ciudad' : 'Probar con salario'} <span aria-hidden="true">↔</span>
      </Button>
    </div>
  );
}
