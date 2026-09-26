import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Comprobaciones de diseño compartidas por las pruebas visuales: desbordes horizontales,
 * regiones con barra propia, texto recortado y consola limpia. No dependen de píxeles, así
 * que valen en Windows, Linux y macOS; las capturas se adjuntan al informe para revisarlas.
 */

export interface LayoutReport {
  /** Píxeles que la página se sale por la derecha. */
  readonly pageOverflow: number;
  /** Tablas, código y regiones educativas con barra horizontal propia. */
  readonly scrollers: readonly string[];
  /** Elementos con texto recortado por `overflow: hidden`. */
  readonly clipped: readonly string[];
  /** Tamaño de letra más pequeño del texto visible, en píxeles. */
  readonly minFont: number;
}

export async function layoutReport(page: Page, scope = 'main'): Promise<LayoutReport> {
  return page.evaluate((selector) => {
    const root = document.querySelector(selector) ?? document.body;
    const describe = (element: Element) =>
      element.getAttribute('aria-label') ??
      `${element.tagName.toLowerCase()}.${String(element.className).split(' ').slice(0, 2).join('.')}`;
    const visible = (element: Element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 2 && box.height > 2 && style.visibility !== 'hidden';
    };
    const scrollers: string[] = [];
    const clipped: string[] = [];
    for (const element of root.querySelectorAll<HTMLElement>('*')) {
      if (!visible(element)) continue;
      const style = getComputedStyle(element);
      const educational = element.matches(
        'pre, table, [role="region"], .dv__table, .ds-code__pre, .sql-code__pre, .scene',
      );
      if (
        educational &&
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        element.scrollWidth > element.clientWidth + 1
      ) {
        scrollers.push(`${describe(element)} ${element.scrollWidth}>${element.clientWidth}`);
      }
      if (
        style.overflow === 'hidden' &&
        !element.closest('.visually-hidden, svg, video, .deck__stage > *') &&
        !element.classList.contains('deck__stage') &&
        element.children.length === 0 &&
        (element.textContent ?? '').trim().length > 0 &&
        (element.scrollHeight > element.clientHeight + 2 ||
          element.scrollWidth > element.clientWidth + 2)
      ) {
        clipped.push(describe(element));
      }
    }
    let minFont = Number.POSITIVE_INFINITY;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (!parent || !walker.currentNode.textContent?.trim()) continue;
      if (!visible(parent) || parent.closest('.visually-hidden, svg')) continue;
      minFont = Math.min(minFont, Number.parseFloat(getComputedStyle(parent).fontSize));
    }
    return {
      pageOverflow: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
      scrollers,
      clipped,
      minFont: Number.isFinite(minFont) ? minFont : 0,
    };
  }, scope);
}

/** Falla si la página o una región educativa necesita desplazamiento horizontal. */
export async function expectNoHorizontalScroll(page: Page, label: string, scope = 'main') {
  const report = await layoutReport(page, scope);
  expect(report.pageOverflow, `${label}: la página se desplaza en horizontal`).toBe(0);
  expect(report.scrollers, `${label}: regiones con barra horizontal`).toEqual([]);
  expect(report.clipped, `${label}: texto recortado`).toEqual([]);
  expect(report.minFont, `${label}: texto demasiado pequeño`).toBeGreaterThanOrEqual(12);
  return report;
}

/** Adjunta una captura al informe para la revisión visual humana. */
export async function attachShot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage, animations: 'disabled' }),
    contentType: 'image/png',
  });
}

/**
 * Registra errores de consola, excepciones sin capturar, avisos de hidratación y
 * violaciones de CSP. Devuelve la lista para comprobar al final.
 */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error') problems.push(`console.error: ${text.slice(0, 200)}`);
    else if (/hydrat|Content Security Policy/i.test(text))
      problems.push(`aviso: ${text.slice(0, 200)}`);
  });
  page.on('pageerror', (error) => problems.push(`excepción: ${error.message.slice(0, 200)}`));
  return problems;
}
