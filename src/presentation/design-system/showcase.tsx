'use client';

import { useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Chip,
  CodeBlock,
  DataTable,
  Dialog,
  Heading,
  LoadingState,
  Progress,
  SearchField,
  Tabs,
  Tooltip,
} from '@/presentation/components/ui';

const sections = [
  ['foundations', 'Fundamentos'],
  ['buttons', 'Botones'],
  ['cards', 'Cards'],
  ['headings', 'Tipografía'],
  ['tabs', 'Tabs y chips'],
  ['search', 'Búsqueda'],
  ['code', 'Código'],
  ['tables', 'Tablas'],
  ['feedback', 'Feedback'],
  ['dialogs', 'Diálogos y ayuda'],
  ['loading', 'Carga'],
] as const;

const swatches = [
  { name: 'Night', token: 'night', hex: '#0B1733', dark: true },
  { name: 'Primary', token: 'primary', hex: '#1746B8', dark: true },
  { name: 'Cyan', token: 'cyan', hex: '#20CCE5', dark: false },
  { name: 'Soft', token: 'soft', hex: '#EAF1FF', dark: false },
  { name: 'Surface', token: 'surface', hex: '#FFFFFF', dark: false },
  { name: 'Success', token: 'success', hex: '#176B45', dark: true },
] as const;

const tokenRows = [
  { id: 'control', name: 'Control', value: '10 px', use: 'Botones y campos' },
  { id: 'card', name: 'Card', value: '20 px', use: 'Tarjetas' },
  { id: 'section', name: 'Section', value: '28 px', use: 'Secciones y portada' },
];

function ShowcaseSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="showcase-section" aria-labelledby={`${id}-title`}>
      <header className="showcase-section-heading">
        <span className="section-number">{number}</span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(40);

  return (
    <div className="site-container showcase-page">
      <section className="showcase-hero" data-theme="dark" aria-labelledby="showcase-title">
        <div>
          <span className="eyebrow">SQL SELECT LAB / Interfaz</span>
          <h1 id="showcase-title">
            Un lenguaje común.
            <br />
            <span>Una experiencia clara.</span>
          </h1>
          <p>
            Fundamentos y componentes del sistema de diseño. Una referencia interna para construir
            cada pantalla con coherencia.
          </p>
          <a className="hero-action hero-action--primary" href="#foundations">
            Explorar componentes <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="showcase-hero-aside">
          <span className="showcase-symbol" aria-hidden="true">
            Aa<span>_</span>
          </span>
          <span>Profesional · Universitario · Tecnológico</span>
          <span className="showcase-version">DESIGN SYSTEM / 01</span>
        </div>
      </section>
      <div className="showcase-layout">
        <aside className="showcase-sidebar">
          <nav aria-label="Índice del sistema de diseño">
            <span className="eyebrow">En esta página</span>
            {sections.map(([id, title]) => (
              <a href={`#${id}`} key={id}>
                {title}
              </a>
            ))}
          </nav>
          <p>Los valores y estados de esta página son muestras de interfaz.</p>
        </aside>
        <div className="showcase-content">
          <ShowcaseSection
            id="foundations"
            number="01"
            title="Fundamentos"
            description="Azules sólidos, superficies claras y acentos que orientan la atención."
          >
            <div className="swatch-grid">
              {swatches.map(({ name, token, hex, dark }) => (
                <div
                  key={token}
                  className="swatch"
                  style={{
                    background: `var(--color-${token})`,
                    color: dark ? 'var(--color-inverse)' : 'var(--color-night)',
                  }}
                >
                  <span>{name}</span>
                  <code>{hex}</code>
                </div>
              ))}
            </div>
            <div className="foundation-notes">
              <div>
                <h3>Espacio para leer</h3>
                <p>
                  Escala de 4 a 64 px. Contenedor de 1320 px y lectura de hasta 72 caracteres por
                  línea.
                </p>
              </div>
              <div>
                <h3>Movimiento discreto</h3>
                <p>
                  Feedback de 150 ms, transiciones de 250 ms y máximo de 350 ms. Se respeta la
                  reducción de movimiento.
                </p>
              </div>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="buttons"
            number="02"
            title="Botones"
            description="Una jerarquía reconocible. Estados visibles sin alterar el tamaño del control."
          >
            <div className="specimen-surface">
              <div className="specimen-row">
                <Button onClick={() => setDialogOpen(true)}>
                  Acción principal <span aria-hidden="true">→</span>
                </Button>
                <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                  Acción secundaria
                </Button>
                <Button variant="text" onClick={() => setDialogOpen(true)}>
                  Acción textual
                </Button>
              </div>
              <div className="specimen-row">
                <Button disabled>Deshabilitado</Button>
                <Button pending pendingLabel="Enviando">
                  Enviar respuesta
                </Button>
                <span className="specimen-caption">Muestra estática del estado de envío</span>
              </div>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="cards"
            number="03"
            title="Cards"
            description="Superficies con propósito. Bordes amplios, sombra suave y contraste alto."
          >
            <div className="row g-5">
              <div className="col-md-6">
                <Card tone="primary">
                  <span className="eyebrow">Azul real</span>
                  <h3>Una acción con contexto.</h3>
                  <p>Superficie de énfasis para accesos y actividades.</p>
                  <Chip tone="cyan">Muestra visual</Chip>
                </Card>
              </div>
              <div className="col-md-6">
                <Card tone="night">
                  <span className="eyebrow">Azul noche</span>
                  <h3>Un espacio para enfocarse.</h3>
                  <p>Contraste para código y momentos destacados.</p>
                  <Chip tone="cyan">Muestra visual</Chip>
                </Card>
              </div>
              <div className="col-md-6">
                <Card tone="white">
                  <h3>Lectura en claro</h3>
                  <p>La superficie principal da espacio al contenido.</p>
                </Card>
              </div>
              <div className="col-md-6">
                <Card tone="soft">
                  <h3>Una pausa visual</h3>
                  <p>El fondo azulado organiza sin competir por atención.</p>
                </Card>
              </div>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="headings"
            number="04"
            title="Tipografía"
            description="Pilas de sistema, sin descarga de fuentes. Jerarquía clara en cada tamaño."
          >
            <div className="specimen-surface type-specimen">
              <span className="eyebrow">Interfaz / System sans</span>
              <Heading level={3} tone="display">
                El valor de comprender.
              </Heading>
              <Heading level={4} tone="section">
                Una idea por sección.
              </Heading>
              <Heading level={5} tone="subsection">
                Detalles que ayudan a avanzar.
              </Heading>
              <p>
                Texto de lectura a 18 px, con interlineado amplio y un ancho contenido. Los
                controles mantienen un mínimo de 16 px.
              </p>
              <code>SELECT · FROM · AS · DISTINCT</code>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="tabs"
            number="05"
            title="Tabs y chips"
            description="Navegación por flechas, Inicio y Fin. Las etiquetas acompañan el significado con texto."
          >
            <Tabs
              label="Ejemplos de superficies"
              items={[
                {
                  id: 'light',
                  label: 'Superficie clara',
                  content: <p>La lectura usa fondos blancos y azul muy claro.</p>,
                },
                {
                  id: 'dark',
                  label: 'Superficie oscura',
                  content: <p>El azul noche destaca código y portada.</p>,
                },
                {
                  id: 'accent',
                  label: 'Acentos',
                  content: <p>El cian se usa sobre oscuro y el verde con moderación.</p>,
                },
              ]}
            />
            <div className="specimen-row chip-row">
              <Chip>Neutral</Chip>
              <Chip tone="primary">Seleccionado</Chip>
              <Chip tone="success">Correcto</Chip>
              <Chip tone="warning">Revisar</Chip>
              <Chip tone="danger">Error</Chip>
              <Chip tone="cyan">Destacado</Chip>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="search"
            number="06"
            title="Búsqueda"
            description="Control y estados visuales. El índice de contenido se incorporará en otra fase."
          >
            <div className="specimen-surface">
              <SearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                hint="Muestra de interfaz sin índice conectado."
              />
              <div className="search-empty" role="status">
                {search
                  ? 'No hay resultados para esta búsqueda'
                  : 'Escribe para revisar el estado sin coincidencias.'}
              </div>
              <SearchField
                label="Búsqueda deshabilitada"
                disabled
                placeholder="Disponible al integrar el contenido"
              />
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="code"
            number="07"
            title="Código"
            description="Editor oscuro, sintaxis legible y copia de texto sin números de línea."
          >
            <CodeBlock
              code={'SELECT nombre, salario\nFROM empleados;'}
              label="SQL · Ejemplo visual, sin ejecución"
              labDisabled
            />
          </ShowcaseSection>
          <ShowcaseSection
            id="tables"
            number="08"
            title="Tablas"
            description="Encabezados semánticos y desplazamiento local. Los datos describen este sistema de diseño."
          >
            <DataTable
              caption="Radios del sistema"
              columns={[
                { id: 'name', header: 'Token', cell: (row) => row.name },
                { id: 'value', header: 'Valor', cell: (row) => row.value, numeric: true },
                { id: 'use', header: 'Aplicación', cell: (row) => row.use },
              ]}
              rows={tokenRows}
              rowKey={(row) => row.id}
            />
            <div className="specimen-gap">
              <DataTable<{ id: string; name: string }>
                caption="Estado vacío"
                columns={[{ id: 'name', header: 'Elemento', cell: (row) => row.name }]}
                rows={[]}
                rowKey={(row) => row.id}
                emptyMessage="No hay elementos para mostrar."
              />
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="feedback"
            number="09"
            title="Feedback y progreso"
            description="Mensajes específicos con texto e icono. El color nunca es la única señal."
          >
            <div className="feedback-stack">
              <Alert title="Información">Este es un ejemplo de mensaje informativo.</Alert>
              <Alert tone="success" title="Correcto">
                La acción de ejemplo se ha completado.
              </Alert>
              <Alert tone="warning" title="Revisa el contenido">
                Comprueba los campos antes de continuar.
              </Alert>
              <Alert tone="danger" title="Servicio no disponible">
                El servicio de ejemplo no está conectado.
              </Alert>
            </div>
            <div className="specimen-surface specimen-gap">
              <Progress label="Progreso de demostración" value={progress} />
              <div className="specimen-row">
                <Button
                  variant="secondary"
                  disabled={progress === 0}
                  onClick={() => setProgress((value) => Math.max(0, value - 20))}
                >
                  Reducir
                </Button>
                <Button
                  variant="secondary"
                  disabled={progress === 100}
                  onClick={() => setProgress((value) => Math.min(100, value + 20))}
                >
                  Aumentar
                </Button>
              </div>
              <span className="specimen-caption">
                Valor de muestra; no representa avance académico.
              </span>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="dialogs"
            number="10"
            title="Diálogos y ayuda"
            description="Foco contenido, cierre con Escape y regreso al control que abrió el diálogo."
          >
            <div className="specimen-surface specimen-row">
              <Button onClick={() => setDialogOpen(true)}>Abrir diálogo</Button>
              <Tooltip label="Ayuda contextual disponible con teclado y toque.">
                Ayuda del componente
              </Tooltip>
            </div>
          </ShowcaseSection>
          <ShowcaseSection
            id="loading"
            number="11"
            title="Estados de carga"
            description="Comunicación de espera accesible, sin animaciones decorativas permanentes."
          >
            <div className="row g-5">
              <div className="col-md-6">
                <Card>
                  <LoadingState label="Cargando componente de ejemplo" />
                </Card>
              </div>
              <div className="col-md-6">
                <Card>
                  <LoadingState variant="skeleton" label="Preparando vista de ejemplo" lines={3} />
                </Card>
              </div>
            </div>
          </ShowcaseSection>
        </div>
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Un espacio para decidir"
        description="Diálogo de demostración del sistema de diseño."
      >
        <p>
          El foco permanece dentro del diálogo. Puedes cerrarlo con Escape o con el botón de cierre.
        </p>
        <Button onClick={() => setDialogOpen(false)}>Entendido</Button>
      </Dialog>
    </div>
  );
}
