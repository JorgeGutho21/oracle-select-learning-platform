import type { HTMLAttributes } from 'react';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  tone?: 'display' | 'section' | 'subsection';
}

export function Heading({
  level = 2,
  tone = 'section',
  className = '',
  children,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag {...props} className={`ds-heading ds-heading--${tone} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
