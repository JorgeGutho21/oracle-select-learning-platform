---
name: DB LAB
description: Plataforma interactiva de Bases de Datos con Oracle
colors:
  primary: '#1746b8'
  primary-hover: '#10368f'
  cyan: '#20cce5'
  page: '#f7f9fc'
  surface: '#ffffff'
  soft: '#eaf1ff'
  surface-alt: '#f0f4fb'
  night: '#0b1733'
  editor: '#091221'
  ink: '#132445'
  muted: '#4c5d78'
  inverse: '#f7faff'
  border-subtle: '#dce3ef'
  border-strong: '#c3cee0'
  sunken: '#eff3fa'
  ink-2: '#2b3a57'
  night-raised: '#12234a'
  inverse-muted: '#b8c4d9'
  border-control: '#63738d'
  success: '#176b45'
  warning: '#855500'
  danger: '#b42332'
  sem-select: '#0e7490'
  sem-from: '#1d4ed8'
  sem-filter: '#6d28d9'
  sem-operator: '#92400e'
  sem-order: '#be185d'
  sem-join: '#047857'
  sem-group: '#c2410c'
  sem-select-dark: '#22d3ee'
  sem-from-dark: '#93b8ff'
  sem-filter-dark: '#c4b5fd'
  sem-operator-dark: '#fcd34d'
  sem-order-dark: '#f9a8d4'
  sem-join-dark: '#6ee7b7'
  sem-group-dark: '#fdba74'
  sem-block: '#0f172a'
  sem-block-dark: '#f8fafc'
  sem-control: '#be123c'
  sem-control-dark: '#fda4af'
typography:
  display:
    fontFamily: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(2.4rem, 4vw + 1rem, 4.5rem)'
    lineHeight: 1.12
    letterSpacing: '-0.035em'
  headline:
    fontFamily: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(2rem, 4.5vw, 3.5rem)'
    lineHeight: 1.12
    letterSpacing: '-0.035em'
  title:
    fontSize: 'clamp(2rem, 3vw, 2.5rem)'
    lineHeight: 1.12
    letterSpacing: '-0.035em'
  body:
    fontFamily: "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '18px'
    lineHeight: 1.65
  control:
    fontSize: '16px'
  code:
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
    fontSize: '17px'
  label:
    fontSize: '0.8125rem'
rounded:
  control: '8px'
  card: '12px'
  section: '16px'
  sm: '4px'
  md: '8px'
  lg: '12px'
  xl: '16px'
  pill: '999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '24px'
  '6': '32px'
  '7': '48px'
  '8': '64px'
  '9': '96px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.inverse}'
    rounded: '{rounded.control}'
    padding: '12px 24px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    rounded: '{rounded.control}'
    padding: '12px 24px'
  button-text:
    backgroundColor: 'transparent'
    textColor: '{colors.primary}'
    rounded: '{rounded.control}'
    padding: '12px 24px'
  input-search:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: '12px 16px'
  card-white:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.card}'
    padding: 'clamp(24px, 3vw, 32px)'
  chip-primary:
    backgroundColor: '{colors.soft}'
    textColor: '{colors.primary}'
    rounded: '{rounded.pill}'
    padding: '4px 12px'
---

# Design System: DB LAB

## Overview

**Creative North Star: "El cuaderno de trabajo de bases de datos"**

Superficies claras, tinta azul noche y código oscuro reúnen una plataforma académica de uso diario. La identidad nace de la relación entre datos de origen, consulta y resultado. La lectura y la práctica tienen prioridad sobre la decoración.

La interfaz usa herramientas familiares, secuencias visibles y acciones explícitas. El color distingue cláusulas SQL, estados y acciones; las superficies separan el trabajo del contexto. El nombre DB LAB y los créditos académicos se conservan en texto. Inter Variable está autoalojada para mantener medidas consistentes entre sistemas y proyectores, con respaldo del sistema y sin proveedor remoto de fuentes.

**Key Characteristics:**

- Superficies de trabajo claras y código oscuro.
- Información secuencial con navegación persistente cuando hay espacio.
- Color semántico SQL acompañado de texto o forma.
- Controles legibles y feedback breve.

Documento reconciliado con la integración `ce32568` del rediseño remoto `a2d6827`, el 19 de octubre de 2026. Sustituye la instantánea de trabajo `9600b85`. No constituye un dictamen de QA ni afirma una revisión visual independiente terminada. Fuentes: `_tokens.scss`, `_base.scss`, `_components.scss`, `_shell.scss`, `_resources.scss`, `_study.scss`, `_learning.scss`, `_data-view.scss`, `_sql.scss`, `_accounts.scss`, `_assessments.scss` y `src/app/layout.tsx`. Contrato de forma: implementación desde código, referencia `seed:247d45123755e633`, corroborada localmente pero generada después de la implementación; no dirigió esta composición. La comprobación corrigió la atribución previa de unavailable.

## Colors

### Primary

El azul de acción (`primary`) identifica enlaces, botones principales y selecciones. Su variante `primary-hover` confirma interacción. El cian se usa sobre superficies oscuras o con tinta azul noche, por ejemplo en acciones de portada; no sustituye texto de lectura sobre blanco.

### Neutral

El papel frío (`page`) contiene superficies blancas de trabajo (`surface`) y áreas azuladas de contexto (`soft`, `surface-alt`). `sunken` agrupa contenido interior sin anidar tarjetas. `ink`, `ink-2` y `muted` organizan el texto. `night` reserva profundidad para portada y juego; `night-raised` distingue capas oscuras e `inverse-muted` su texto secundario. `editor` distingue código y consolas. Los bordes separan contenido (`border-subtle`, `border-strong`) o delimitan controles (`border-control`).

### Named Rules

**The SQL Meaning Rule.** SELECT usa cian; FROM azul; WHERE violeta; operadores ámbar; ORDER BY magenta; JOIN verde; GROUP BY naranja. Las variantes `-dark` sirven sobre código oscuro. PL/SQL usa estructura neutra y control rosado. El color siempre acompaña texto o forma.

**The Explicit State Rule.** Correcto, advertencia y error incluyen texto o símbolo además del color semántico.

## Typography

Inter Variable resuelve títulos, lectura y controles mediante `next/font/local`, peso 100–900, `display: swap` y fallback ajustado Arial. La fuente proviene de `@fontsource-variable/inter`, licencia OFL. La monoespaciada se reserva a SQL, identificadores y datos. Los tokens normativos están en el frontmatter. La escala de pantalla general conserva h1 hasta 56 px, h2 hasta 40 px y h3 de 24 px; la portada puede usar el token display. Los títulos equilibran líneas y usan tracking de −0.035em.

El cuerpo base es de 18 px con línea 1.65; controles de 16 px y código de lectura de 17 px. Los textos secundarios tienen sus roles específicos; no se usan para encoger contenido principal. El máximo legible del sistema es 72ch. Las escenas de clase tienen medidas propias de proyección: no heredan automáticamente los tamaños de interfaz.

**The Recompose Before Shrinking Rule.** Resolver densidad cambiando columnas, agrupación o representación; conservar tamaños legibles de texto, tablas y código.

## Layout

El contenedor máximo es de 1320 px; el estrecho, de 960 px. La escala de espacio recorre de 4 a 96 px. Los breakpoints principales son 576, 768, 992, 1200 y 1400 px. Las columnas flexibles usan `minmax(0, 1fr)` y sus hijos permiten encogimiento.

La cabecera pública mide al menos 64 px y pasa a navegación móvil por debajo de 992 px. Las secciones usan tarjetas de altura coherente en una retícula que se apila al reducir el ancho. El temario S2/S3 usa una cuadrícula continua de lecciones con el bloque dentro de su primera tarjeta; la lección tiene índice lateral cuando cabe, como S1. Los modos se mantienen en navegación horizontal adaptable. Recursos presenta dos columnas cuando caben, con filtros y búsqueda sobre el contenido existente. El rail experimental de modos de `9600b85` y su hoja `_learning-workspace.scss` no forman parte del sistema integrado.

Las tablas mantienen encabezados, título contextual y valores tabulares; las representaciones adaptables existentes deciden cómo dividir columnas. No introducir desplazamiento horizontal de página para solucionar una tabla. El lienzo de clase conserva sus reglas 16:9/4:3 y sus límites de proyector documentados por separado.

## Elevation & Depth

Las superficies, los bordes finos y la separación crean la estructura. Las sombras son suaves y azul noche: xs para detalle (0 1px 2px al 6 %), sm para elevación ligera (0 2px 8px al 8 %), elevated para panel (0 8px 24px al 10 %), md para hover/panel flotante (0 12px 32px al 12 %) y lg para capas altas (0 24px 56px al 16 %).

Las definiciones exactas, foco y capas viven en el sidecar. Ningún nuevo panel necesita sombra solo por ser un panel. Los efectos React Bits respetan el presupuesto por superficie: un protagonista en una pantalla pública y ninguno en Lab, Estudio, Exposición ni Challenge; presupuesto cero significa no montar el efecto.

## Shapes

Controles con radio de 8 px, tarjetas de 12 px y secciones de 16 px. La escala secundaria es de 4/8/12/16 px. Pills de 999 px pertenecen a chips y badges, no a todos los contenedores. El borde normal es fino y sólido; los estados futuros pueden usar borde discontinuo acompañado de etiqueta.

## Components

### Buttons

Acción principal azul con texto inverso; secundaria blanca con borde de control; textual sin fondo. Padding de 12 × 24 px, tipografía de 16 px y peso 650. Objetivo mínimo de 44 × 44 px. Los botones ocupados conservan su geometría; deshabilitados indican indisponibilidad. El feedback usa 150 ms. La presión con puntero desplaza 1 px; no se aplica al foco visible de teclado.

### Chips

Formas compactas, texto de 16 px y padding de 4 × 12 px. Los filtros interactivos muestran su selección mediante `aria-pressed` y estado visual. Las etiquetas de estado son informativas y no deben parecer botones si carecen de acción.

### Cards / Containers

Fondo blanco o contextual, borde sutil y padding de 24 a 32 px. Son agrupaciones de contenido, no el patrón obligatorio de una página. Los temarios y las misiones del Challenge usan retículas continuas; las listas operativas conservan su propia densidad. Las zonas interiores usan superficie hundida antes de anidar otra tarjeta. Los modos muestran icono, nombre, descripción y acción.

### Inputs / Fields

Etiqueta visible, tinta azul noche sobre blanco y borde de control. Búsqueda tiene altura mínima de 52 px. Ayuda y error quedan asociados al campo; el placeholder no reemplaza la etiqueta. La búsqueda de recursos filtra el contenido existente sin sensibilidad a tildes, abre bloques coincidentes y ofrece limpiar y estado vacío.

### Navigation

La navegación pública muestra identidad, herramientas y cuenta; el enlace activo tiene indicador inferior de 2 px. Breadcrumbs ubican el contexto; el modo activo usa `aria-current`. El índice lateral de lección se adapta al ancho disponible. Las pestañas de modos hacen wrap en móvil y pueden ocupar varias filas; no se documenta una retícula fija de tres/dos columnas que el código integrado no implementa.

### Datos, SQL y feedback

Origen, consulta y resultado tienen rótulos distintos. Código oscuro y tablas claras conservan colores SQL semánticos. Una verificación previa en Oracle se rotula como verificada; nunca equivale a ejecución en vivo. Feedback conserva trabajo y expresa una recuperación concreta. NULL tiene representación explícita. No modificar estos contratos por razones estéticas.

El foco global usa anillo de 3 px y separación de 2 px; el foco de botones utiliza además el token de doble sombra para separar superficie y contorno. `prefers-reduced-motion` suprime movimiento no esencial. Las transiciones comunes usan 150/250 ms y easing exponencial (`ease-out`) o estándar; la entrada de portada tiene token separado de 500 ms y no debe extenderse a tareas frecuentes.

## Do's and Don'ts

### Do:

- **Do** usar las superficies claras y reservar código oscuro a su función.
- **Do** conservar texto, forma y semántica junto al color SQL y los estados.
- **Do** resolver densidad mediante composición y mantener el objetivo táctil de 44 px.
- **Do** reutilizar tokens y componentes antes de añadir excepciones locales.
- **Do** conservar geometría de proyección, contenido académico y contratos de datos.

### Don't:

- **Don't** presentar resultados verificados como una ejecución Oracle en vivo.
- **Don't** convertir todo el producto en modo oscuro ni anidar paneles sin propósito.
- **Don't** depender de proveedores remotos de fuentes ni de efectos para contenido esencial.
- **Don't** ocultar errores, controles o información esencial para sostener una composición.

Deriva no canonizada: persisten rótulos/eyebrows y tamaños locales en algunas superficies. Se registran como excepciones existentes, no como patrón a propagar. Los presupuestos de animación no permiten inferir aprobación de todas las combinaciones de contraste o tamaño. La aprobación visual independiente y los resultados por navegador pertenecen al informe QA, no se deducen de esta documentación.
