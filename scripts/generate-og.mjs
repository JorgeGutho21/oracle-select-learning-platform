import { chromium } from '@playwright/test';

// A code-generated social card, using the project's colors and system typography.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="es"><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;padding:72px 80px;color:#f5f8ff;font-family:system-ui,sans-serif;background:linear-gradient(130deg,#153b91,#08152a 75%)}
  body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px);background-size:48px 48px;pointer-events:none}
  .eyebrow{font-size:24px;letter-spacing:3px;font-weight:750;color:#d7e8ff}h1{font-size:150px;line-height:1;margin:48px 0 20px;font-weight:850;letter-spacing:-6px}h1 span{color:#16c8df}.subtitle{font-size:31px;font-weight:750;margin:0 0 28px}.chips{display:flex;gap:14px}.chips span{border:1px solid #52627c;border-radius:24px;padding:7px 16px;font-size:20px}.chips b{color:#16c8df;font-family:monospace}footer{position:absolute;bottom:70px;font-size:18px;color:#cbd8ec}footer strong{color:#fff}
  </style><body><div class="eyebrow">PROYECTO ACADÉMICO · ORACLE DATABASE</div><h1>DB <span>LAB</span></h1><p class="subtitle">Plataforma interactiva de Bases de Datos con Oracle</p><div class="chips"><span><b>01</b> Fundamentos SQL</span><span><b>02</b> Consultas relacionales</span><span><b>03</b> PL/SQL y automatización</span></div><footer><strong>Jorge Gutiérrez Thomas</strong> · Docente: <strong>Amilkar Sierra Romano</strong> · Bases de Datos · Universidad Popular del Cesar</footer></body></html>`);
  await page.screenshot({ path: 'src/app/opengraph-image.png', animations: 'disabled' });
} finally {
  await browser.close();
}
