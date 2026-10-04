# Despliegue de producción — DB LAB Fase 5

Estado actual: candidato técnico validado; release operativo BLOCKED por SMTP UNKNOWN; producción no promovida. Este registro prevalece sobre los identificadores históricos de DEPLOYMENT.md.

## Estado inspeccionado

| Dato                          | Verificado                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Proyecto Vercel               | sql-select-lab, prj_Q5z6OKMwZjDFDqxARioo20utGBnR                                                                                                |
| Producción pública            | https://sql-select-lab.vercel.app                                                                                                               |
| Deployment activo anterior    | dpl_8EjVpuRWJfYvuqocHZR6nWA17ou2                                                                                                                |
| URL inmutable anterior        | https://sql-select-6enpnesm3-jorge-gutierrez1.vercel.app                                                                                        |
| Commit de producción anterior | 874f7748acf030f62dbb02bbaea0b204bdd36441                                                                                                        |
| Rama anterior                 | claude-final-ui-polish-20260926                                                                                                                 |
| Integración Git               | No conectada según API; no se asume despliegue automático por push.                                                                             |
| Rama de release               | codex-phase5-production-final-20261004                                                                                                          |
| Preview inicial Fase 5        | https://sql-select-6e4j0ezed-jorge-gutierrez1.vercel.app (READY, commit 0bef19dd03cee515083f6f99985f8d2d573be462); aún no es el candidato final |

Las variables públicas Supabase deben existir durante el build para que la CSP permita su HTTPS/WebSocket. Oracle Cloud, cartera, claves de servicio y claves del facilitador son exclusivamente de servidor. `.vercelignore` excluye secretos, archivos locales, compilaciones, capturas, logs y DOCX. Las variables existentes de Preview/Production fueron inspeccionadas por nombre, sin imprimir valores.

Preview vigente READY verificado: `dpl_JCzxJMZDNY6hKh5hrKZi3tNKtenE`, https://sql-select-e2uxkgvcr-jorge-gutierrez1.vercel.app, commit `f067058f8d886f1498d7a9bdd821d0503ef18e64`, rama `codex-phase5-production-final-20261004`. La API confirma el proyecto propio y target distinto de producción. Incluye la corrección de Tooltip y el aviso REST del monitor docente. Sustituye el Preview 5126e05 (100 PASS, 2 FAIL, 2 sin ejecutar de 104), que no debe promoverse. QA del sustituto: 104/104 PASS y 5/5 adicionales de pantallas críticas, con 22 análisis axe WCAG 2.2 A/AA sin infracciones. Producción sigue en dpl_8EjVpuRWJfYvuqocHZR6nWA17ou2, commit 874f7748acf030f62dbb02bbaea0b204bdd36441; alias público y Preview reinspeccionados al cerrar. Los commits posteriores a f067058 solo añaden QA y documentación; no se confunde el HEAD final con el hash del deployment.

## Migraciones reales

Se aplicaron a la base existente, con CA oficial y verificación TLS, dentro de una transacción:

- `20261002120000_learner_accounts.sql`: SHA-256 LF `6e673d3ad49b99ef78ba1fbbf36b9df4aab7b02e6304993fe14a9b65a93cbd98`.
- `20261003120000_assessments.sql`: SHA-256 LF `d204d05b5d9dd915d3b8b8ed91ce7c19daeab27662261968129e3ec7e12a21c2`.

Versiones registradas en `supabase_migrations.schema_migrations`; 18 tablas con RLS. Antes/después: 28 salas, 39 participantes, 22 intentos de sala, 2 pistas, 22 resultados. Evidencia: `output/playwright/phase5/remote-migrations.json`. No se recreó el proyecto, no se borraron datos previos y se conservó el banco oficial sincronizado de 150 preguntas.

## Gate de promoción

Primero commit verificable y Preview. Después smoke público, cuentas/progreso, evaluaciones por sección, sala real, Oracle y cabeceras contra el despliegue. Las cuentas/exámenes/sala de QA se eliminan por IDs propios; no se hace carga de 40 clientes en el proyecto remoto compartido.

El envío y recuperación de correo remotos necesitan un SMTP y un buzón autorizado. La configuración y entrega no se dan por hechas a partir de Mailpit local o de cuentas confirmadas por API administrativa. Microsoft permanece BLOCKED mientras Azure esté desactivado; eso no altera el acceso de invitado/correo. Las acciones manuales de Microsoft están en AUTH_ARCHITECTURE.

El encargo de cierre del 4 de octubre permite publicar con Microsoft desactivado y con SMTP externo ausente si la implementación está validada por otros medios. Esa excepción no equivale a afirmar que SMTP esté ausente: la API pública no expone el ajuste, no hay PAT de Management ni sesión de dashboard disponible, y la confirmación del responsable está pendiente. Deben pasar los gates técnicos y el Preview; cualquier P0/P1 real impide la promoción. Firefox puede quedar NOT_TESTED por el runtime documentado.

Preview y Production apuntan actualmente al mismo proyecto Supabase. Por ello, la QA remota no hace carga de 40 usuarios, publica únicamente para UUID propios y elimina sus cuentas/exámenes/sala al terminar. La inspección posterior debe comprobar que permanecen las 28 salas, 39 participantes, 22 intentos, 2 pistas y 22 resultados previos, y el banco oficial de 150.

La ausencia de tablas en `supabase_realtime` es esperada: los adaptadores usan Broadcast: avisos REST desde servidor en sala y evaluaciones; se conserva además `realtime.send` en la base, sin retransmitir datos privados. La QA debe observar el cambio en un monitor ya abierto antes de los 60 s de sondeo de seguridad; no se añade replicación de tablas privadas.

## Configuración externa pendiente

| Pantalla                                              | Campos y valor esperado                                                                                                                      | Prueba necesaria                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase → Authentication → Email / SMTP Settings     | SMTP habilitado; remitente de un dominio autorizado; host, puerto, usuario y contraseña del proveedor, introducidos directamente en Supabase | Registrar un buzón propio autorizado, recibir y confirmar el correo; cerrar/reabrir sesión; recuperar contraseña y consumir el enlace una sola vez |
| Supabase → Authentication → URL Configuration         | Site URL `https://sql-select-lab.vercel.app`; redirects del sitio y del Preview concreto `/auth/callback`                                    | Los enlaces vuelven a la aplicación correcta; no se acepta una URL externa arbitraria                                                              |
| Supabase → Email Templates                            | Confirm signup y Reset password según `supabase/templates/`, con `token_hash` y `/auth/confirm`                                              | Confirmación mediante POST, incluso desde otro navegador; enlace vencido/reusado rechazado                                                         |
| Microsoft Entra → App registrations; Supabase → Azure | Client ID y secreto privados; callback `https://byjkkxrrkodyduskdimg.supabase.co/auth/v1/callback`; tenant aprobado por la institución       | Acceso, consentimiento cancelado, logout y perfil; el botón sigue desactivado mientras Azure no esté habilitado                                    |
| Supabase → SQL Editor → institutional_domains         | Solo dominio institucional confirmado por el responsable; no se inventa un dominio                                                           | Cuenta confirmada del dominio autorizado: perfil verificado; un dominio ajeno no lo está                                                           |

Estado SMTP: UNKNOWN; correo remoto BLOCKED para verificar configuración y entrega. No se clasifica como BLOCKED_EXTERNAL_CONFIGURATION mientras no se confirme la ausencia de SMTP. Azure: NOT_CONFIGURED (`azure: false` observado). Dominio institucional: requiere validación del responsable. No se solicitan secretos en el chat ni se abre un proveedor de pago.

Supabase indica que su SMTP inicial está destinado a pruebas y restringe destinatarios; una cuenta creada por la API administrativa no acredita el envío de correo. Fuentes oficiales: [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Azure](https://supabase.com/docs/guides/auth/social-login/auth-azure). La autorización del buzón y sus enlaces sigue pendiente de respuesta humana.

## Reversión

Conservar el deployment anterior indicado arriba. Si se llega a promover Fase 5, verificar el alias y el commit mediante inspect/API y ejecutar smoke de producción. Ante fallo crítico, volver al deployment anterior con la CLI de Vercel o el dashboard y verificar otra vez el alias.

Desde la raíz de este repositorio, con la autenticación existente, el rollback al deployment anterior es:

```powershell
npx vercel@60.0.1 rollback dpl_8EjVpuRWJfYvuqocHZR6nWA17ou2 --yes --global-config .vercel/cli
```

Después inspeccionar `sql-select-lab.vercel.app`, comprobar el commit `874f7748acf030f62dbb02bbaea0b204bdd36441` y repetir el smoke público. El comando se documentó y su ayuda se verificó; no se ejecutó una reversión innecesaria. Referencia oficial: [Vercel rollback](https://vercel.com/docs/cli/rollback).

Las migraciones son aditivas y permanecen al revertir código. No ejecutar DROP ni una reversión destructiva de datos de cuentas/evaluaciones. Los esquemas y lectores Oracle anteriores se conservan. La selección de rollback se basa en el deployment inspeccionado, no en los IDs obsoletos de informes de septiembre.

## Build local final

Build optimizado de producción: PASS con configuración pública real de Production y credenciales privadas locales. Ocho valores de servidor en env pull se devolvieron como [SENSITIVE], permanecen en archivo ignorado y nunca se usaron como secretos válidos. No se declara equivalencia con el runtime privado de Production ni smoke de la versión nueva. El Preview cloud READY y sus pruebas remotas acreditan su propia configuración.
