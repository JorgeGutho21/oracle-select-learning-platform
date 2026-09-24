'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useId, useMemo, useState, type ReactNode } from 'react';

/**
 * Constructor de secuencias con piezas. Tres formas equivalentes de responder (D02, G14):
 * arrastrar con ratón o toque; tocar o pulsar Enter en una pieza para añadirla; y
 * seleccionar una pieza colocada para moverla o quitarla con botones. Todas producen la
 * misma lista de identificadores.
 */

export interface BuilderPiece {
  readonly id: string;
  readonly text: string;
  readonly role?: string;
}

export interface SequenceBuilderProps {
  label: string;
  paletteLabel: string;
  pieces: readonly BuilderPiece[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** Las piezas reutilizables permanecen en la paleta tras usarse. */
  reusable?: boolean;
  disabled?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Separador visual entre piezas colocadas (por ejemplo, la coma de SELECT). */
  separator?: string;
  emptyText: string;
}

const PALETTE = 'palette';
const TARGET = 'target';

const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : rectIntersection(args);
};

function slotKeys(value: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return value.map((id) => {
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    return `slot:${id}~${count}`;
  });
}

function PalettePiece({
  piece,
  disabled,
  onAdd,
}: {
  piece: BuilderPiece;
  disabled: boolean;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${piece.id}`,
    disabled,
    attributes: { roleDescription: 'pieza arrastrable' },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className={`ch-piece ch-piece--${piece.role ?? 'neutral'}${isDragging ? ' ch-piece--ghost' : ''}`}
      disabled={disabled}
      aria-label={`Añadir ${piece.text}`}
      onClick={onAdd}
    >
      {piece.text}
    </button>
  );
}

function SlotPiece({
  sortableId,
  piece,
  index,
  selected,
  disabled,
  onSelect,
}: {
  sortableId: string;
  piece: BuilderPiece;
  index: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    disabled,
    attributes: { roleDescription: 'pieza colocada' },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`ch-piece ch-piece--placed ch-piece--${piece.role ?? 'neutral'}${selected ? ' ch-piece--selected' : ''}${isDragging ? ' ch-piece--ghost' : ''}`}
      aria-pressed={selected}
      aria-label={`${piece.text}, posición ${index + 1}`}
      disabled={disabled}
      onClick={onSelect}
    >
      {piece.text}
    </button>
  );
}

function Zone({ id, className, children }: { id: string; className: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className}${isOver ? ' ch-zone--over' : ''}`}>
      {children}
    </div>
  );
}

export function SequenceBuilder({
  label,
  paletteLabel,
  pieces,
  value,
  onChange,
  reusable = false,
  disabled = false,
  prefix,
  suffix,
  separator,
  emptyText,
}: SequenceBuilderProps) {
  const labelId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<BuilderPiece | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const byId = useMemo(() => new Map(pieces.map((piece) => [piece.id, piece])), [pieces]);
  const keys = slotKeys(value);
  const palette = reusable ? pieces : pieces.filter((piece) => !value.includes(piece.id));
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const textOf = (id: string) => byId.get(id)?.text ?? id;
  const update = (next: string[], message: string) => {
    onChange(next);
    setAnnouncement(message);
  };

  const add = (pieceId: string, at = value.length) => {
    const next = [...value];
    next.splice(at, 0, pieceId);
    update(next, `${textOf(pieceId)} colocada en la posición ${at + 1} de ${next.length}.`);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    update(
      arrayMove([...value], from, to),
      `${textOf(value[from]!)} movida a la posición ${to + 1}.`,
    );
    setSelected(to);
  };
  const remove = (index: number) => {
    const pieceId = value[index]!;
    update(
      value.filter((_, position) => position !== index),
      `${textOf(pieceId)} retirada.`,
    );
    setSelected(null);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    const pieceId = id.startsWith('palette:')
      ? id.slice('palette:'.length)
      : value[keys.indexOf(id)];
    setDragging(pieceId ? (byId.get(pieceId) ?? null) : null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const overSlot = keys.indexOf(overId);
    if (activeId.startsWith('palette:')) {
      if (overId === PALETTE) return;
      add(activeId.slice('palette:'.length), overSlot === -1 ? value.length : overSlot);
      return;
    }
    const from = keys.indexOf(activeId);
    if (from === -1) return;
    if (overId === PALETTE) remove(from);
    else move(from, overSlot === -1 ? value.length - 1 : overSlot);
  };

  return (
    <div className="ch-builder">
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Arrastra la pieza con el ratón o con el dedo. También puedes pulsarla para añadirla o seleccionarla y usar los botones para moverla.',
          },
          announcements: {
            onDragStart: () => 'Pieza tomada.',
            onDragOver: () => undefined,
            onDragEnd: ({ over }) => (over ? 'Pieza soltada.' : 'Pieza devuelta a su lugar.'),
            onDragCancel: () => 'Arrastre cancelado.',
          },
        }}
      >
        <p className="ch-builder__label" id={labelId}>
          {label}
        </p>
        <Zone id={TARGET} className="ch-zone ch-zone--target">
          <div className="ch-sequence" role="group" aria-labelledby={labelId}>
            {prefix && <span className="ch-fixed">{prefix}</span>}
            <SortableContext items={keys} strategy={rectSortingStrategy}>
              {value.length === 0 && <span className="ch-sequence__empty">{emptyText}</span>}
              {value.map((pieceId, index) => (
                <span className="ch-sequence__item" key={keys[index]}>
                  {separator && index > 0 && (
                    <span className="ch-separator" aria-hidden="true">
                      {separator}
                    </span>
                  )}
                  <SlotPiece
                    sortableId={keys[index]!}
                    piece={byId.get(pieceId) ?? { id: pieceId, text: pieceId }}
                    index={index}
                    selected={selected === index}
                    disabled={disabled}
                    onSelect={() => setSelected(selected === index ? null : index)}
                  />
                </span>
              ))}
            </SortableContext>
            {suffix && <span className="ch-fixed">{suffix}</span>}
          </div>
        </Zone>
        {selected !== null && value[selected] !== undefined && !disabled && (
          <div
            className="ch-toolbar"
            role="toolbar"
            aria-label={`Acciones para ${textOf(value[selected])}`}
          >
            <button
              type="button"
              className="ch-tool"
              onClick={() => move(selected, selected - 1)}
              disabled={selected === 0}
            >
              <span aria-hidden="true">←</span> Mover antes
            </button>
            <button
              type="button"
              className="ch-tool"
              onClick={() => move(selected, selected + 1)}
              disabled={selected === value.length - 1}
            >
              Mover después <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="ch-tool ch-tool--remove"
              onClick={() => remove(selected)}
            >
              Quitar
            </button>
          </div>
        )}
        <p className="ch-builder__label">{paletteLabel}</p>
        <Zone id={PALETTE} className="ch-zone ch-zone--palette">
          <div className="ch-palette">
            {palette.map((piece) => (
              <PalettePiece
                key={piece.id}
                piece={piece}
                disabled={disabled}
                onAdd={() => add(piece.id)}
              />
            ))}
            {palette.length === 0 && (
              <span className="ch-sequence__empty">Colocaste todas las piezas.</span>
            )}
          </div>
        </Zone>
        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <span className={`ch-piece ch-piece--overlay ch-piece--${dragging.role ?? 'neutral'}`}>
              {dragging.text}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>
      <p className="ds-sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
