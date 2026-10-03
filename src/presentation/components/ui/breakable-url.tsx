import { Fragment } from 'react';

export interface BreakableUrlProps {
  readonly url: string;
}

/**
 * Dirección con cortes de línea preferidos tras «/», «.», «?», «&», «=», «#» y «-»: si no
 * cabe, se parte entre sus partes y no a mitad de una palabra.
 */
export function BreakableUrl({ url }: BreakableUrlProps) {
  const parts = url.split(/(?<=[/.?&=#-])/);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </>
  );
}
