import type { ReactNode } from 'react';
import { ColumnTabs } from './column-tabs';

export interface RecordTableRow {
  readonly key: string;
  readonly cells: readonly ReactNode[];
  readonly className?: string;
}

/** Administrative records remain tables at every width, with identity in each column group. */
export function RecordTable({
  caption,
  columns,
  rows,
  className = '',
}: {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly RecordTableRow[];
  readonly className?: string;
}) {
  const table = (indices: readonly number[]) => (
    <table>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          {indices.map((index) => (
            <th key={index} scope="col">
              {columns[index]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={row.className}>
            {indices.map((index) =>
              index === 0 ? (
                <th key={index} scope="row">
                  {row.cells[index]}
                </th>
              ) : (
                <td key={index}>{row.cells[index]}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
  const indices = columns.map((_, index) => index);
  const groups = [];
  for (let index = 1; index < columns.length; index += 2) {
    const group = indices.slice(index, index + 2);
    groups.push({
      key: String(index),
      label: group.map((column) => columns[column]).join(' · '),
      panel: table([0, ...group]),
    });
  }
  return (
    <div className={`record-table ${className}`}>
      <div className="record-table__full">{table(indices)}</div>
      <div className="record-table__compact">
        <ColumnTabs label={caption} tabs={groups} />
      </div>
    </div>
  );
}
