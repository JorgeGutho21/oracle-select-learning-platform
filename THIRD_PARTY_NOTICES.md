# Avisos de terceros

DB LAB incluye código adaptado de proyectos de terceros. Este archivo conserva los avisos que exigen sus licencias.

## React Bits

- **Origen:** <https://github.com/DavidHDev/react-bits>, variante TypeScript + CSS (`src/ts-default/`).
- **Versión revisada:** commit `4d6a46d` del 2 de octubre de 2026.
- **Alcance:** solo componentes del repositorio público gratuito, sin dependencias externas. No se usó código de React Bits Pro.

| Componente original                       | Archivo en DB LAB                                        | Uso                                                         |
| ----------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| `Components/SpotlightCard`                | `src/presentation/components/effects/spotlight-card.tsx` | Luz que sigue al ratón en las tarjetas de sección y de modo |
| `Animations/StarBorder`                   | `src/presentation/components/effects/star-border.tsx`    | Borde con destellos de la sección disponible                |
| `Components/PixelCard`                    | `src/presentation/components/effects/pixel-card.tsx`     | Píxeles de las secciones «Próximamente»                     |
| `Backgrounds/ShapeGrid` (antes «Squares») | `src/presentation/components/effects/shape-grid.tsx`     | Fondo de celdas de la portada                               |

Los estilos de esos componentes están en `src/styles/_effects.scss`. Cada archivo indica en su encabezado los cambios hechos sobre el original.

Las condiciones de la licencia permiten usar los componentes como parte de una aplicación o un sitio. Prohíben venderlos, sublicenciarlos o redistribuirlos como componentes en sí.

```text
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
