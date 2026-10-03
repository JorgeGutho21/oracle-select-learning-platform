'use client';

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { PLSQL, sql } from '@codemirror/lang-sql';
import { bracketMatching, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useEffect, useRef } from 'react';

/**
 * Editor SQL profesional (CodeMirror 6). Resalta sintaxis, marca los diagnósticos del
 * analizador en su posición y ejecuta la acción principal con Ctrl/Cmd+Enter. Tab no
 * queda atrapado: sale del editor (DESIGN_SYSTEM, contrato del editor). No valida ni
 * ejecuta SQL por sí mismo.
 */

export interface EditorDiagnostic {
  readonly from: number;
  readonly to: number;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  label: string;
  describedBy?: string;
  diagnostics?: readonly EditorDiagnostic[];
  readOnly?: boolean;
  placeholderText?: string;
}

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#20cce5', fontWeight: '600' },
  { tag: [tags.number, tags.integer, tags.float], color: '#ffd08a' },
  { tag: [tags.string, tags.special(tags.string)], color: '#a8e6b8' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#a2b1cb',
    fontStyle: 'italic',
  },
  { tag: [tags.operator, tags.punctuation, tags.name, tags.propertyName], color: '#f7faff' },
]);

const theme = EditorView.theme(
  {
    '&': {
      color: 'var(--color-inverse)',
      backgroundColor: 'var(--color-editor)',
      fontSize: 'var(--text-code)',
      borderRadius: 'var(--radius-control)',
    },
    '&.cm-focused': { outline: '3px solid var(--color-cyan)', outlineOffset: '2px' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6', minHeight: '9rem' },
    '.cm-content': { caretColor: '#20cce5', padding: '12px 0' },
    '.cm-cursor': { borderLeftColor: '#20cce5', borderLeftWidth: '2px' },
    '.cm-gutters': { backgroundColor: 'var(--color-editor)', color: '#a2b1cb', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgb(255 255 255 / 5%)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgb(255 255 255 / 8%)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgb(32 204 229 / 30%)',
    },
    '.cm-placeholder': { color: '#a2b1cb' },
    '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px solid #ff8a95' },
    '.cm-lintRange-warning': { backgroundImage: 'none', borderBottom: '2px dashed #ffd08a' },
    '.cm-tooltip': {
      backgroundColor: 'var(--color-night)',
      color: 'var(--color-inverse)',
      border: '1px solid var(--color-border-control)',
    },
  },
  { dark: true },
);

export function SqlEditor({
  value,
  onChange,
  onSubmit,
  label,
  describedBy,
  diagnostics = [],
  readOnly = false,
  placeholderText = 'SELECT columna FROM empleados;',
}: SqlEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latestValue = useRef(value);
  const handlers = useRef({ onChange, onSubmit });

  useEffect(() => {
    handlers.current = { onChange, onSubmit };
    latestValue.current = value;
  });

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: latestValue.current,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          sql({ dialect: PLSQL, upperCaseKeywords: true }),
          syntaxHighlighting(highlight),
          lintGutter(),
          // Con zoom alto o pantallas estrechas, la consulta se lee entera sin desplazar en
          // horizontal (WCAG 1.4.10). No altera el texto ni las posiciones de diagnóstico.
          EditorView.lineWrapping,
          placeholder(placeholderText),
          keymap.of([
            {
              key: 'Mod-Enter',
              preventDefault: true,
              run: () => {
                handlers.current.onSubmit?.();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const text = update.state.doc.toString();
              latestValue.current = text;
              handlers.current.onChange(text);
            }
          }),
          EditorView.contentAttributes.of({
            'aria-label': label,
            'aria-multiline': 'true',
            ...(describedBy ? { 'aria-describedby': describedBy } : {}),
            spellcheck: 'false',
            autocorrect: 'off',
            autocapitalize: 'off',
          }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          theme,
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, [label, describedBy, readOnly, placeholderText]);

  // Cambios externos (cargar un ejemplo, reiniciar) sin perder el historial del editor.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const length = editor.state.doc.length;
    editor.dispatch(
      setDiagnostics(
        editor.state,
        diagnostics.map((item) => ({
          from: Math.min(item.from, length),
          to: Math.min(Math.max(item.to, item.from + 1), length),
          severity: item.severity,
          message: item.message,
        })),
      ),
    );
  }, [diagnostics]);

  return <div className="sql-editor" ref={host} />;
}
