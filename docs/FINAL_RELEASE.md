# Release de DB LAB — Fase 5

**BLOCKED: candidato técnico verificado; producción no promovida.** SMTP remoto sigue UNKNOWN y la entrega real no está verificada. No se cumple todavía la excepción de SMTP externo ausente que permite el encargo de cierre. Conclusión C: DB LAB todavía NO debe publicarse.

Rama: `codex-phase5-production-final-20261004`. Base: `6fda02bec66f4ef5f0837ef0efda5cdd7587b787`; `889716c` es ancestro verificado. Checkpoint anterior conservado: `01e83ac`. `main` y el DOCX personal permanecen intactos.

Se corrigieron la identidad de Amilkar Sierra Romano, el resumen real de 78 lecciones, la metadata futura de S1, las tablas docentes en móvil y el CSV para Excel español, incluida la neutralización de fórmulas con prefijos de control. Se preservaron las funcionalidades de las fases 1–4, el sistema visual y los cuatro efectos React Bits gratuitos.

Las dos migraciones aditivas de cuentas/evaluaciones están aplicadas al Supabase remoto, 18 tablas con RLS, sin pérdida de las salas anteriores. El banco contiene 50 preguntas oficiales por sección: 150. Oracle Free verificó currículo SQL/PLSQL, incluidos triggers antes/después; Oracle Cloud 19c verificó únicamente S1.

Evidencia detallada: [FINAL_QA_REPORT](FINAL_QA_REPORT.md). Arquitectura: [FINAL_ARCHITECTURE](FINAL_ARCHITECTURE.md). Seguridad y límites: [SECURITY_FINAL](SECURITY_FINAL.md). URLs, commits desplegados, configuración externa y rollback: [PRODUCTION_DEPLOYMENT](PRODUCTION_DEPLOYMENT.md). Operación: [TEACHER_GUIDE](TEACHER_GUIDE.md), [STUDENT_GUIDE](STUDENT_GUIDE.md).

## Gates y pendientes

Correo remoto: configuración y entrega sin verificar; requiere un buzón autorizado y las pruebas de confirmación/recuperación. Microsoft está desactivado en el proyecto. Firefox oficial no arranca en este Windows por un ensamblado `mozglue` ausente; no se atribuye a la aplicación. Zoom nativo, lector de pantalla, móvil físico y proyector: NOT_TESTED. El reflujo equivalente a zoom se valida por separado.

El encargo final admite correo remoto BLOCKED_EXTERNAL_CONFIGURATION únicamente si se confirma que falta SMTP externo y la implementación está validada por otros medios. Su configuración sigue desconocida, por lo que todavía no se cumple esa excepción. Microsoft desactivado (credenciales privadas no expuestas) y Firefox con limitación demostrada del runtime son excepciones admitidas. El candidato Preview debe pasar la QA remota con datos temporales propios y limpieza por UUID; los 40 clientes se prueban solo en local. Ningún P0/P1 real permite promover.

## Indicadores de cierre

Lint, typecheck, formato y build de producción pasan. Vitest: 1992 PASS, 0 FAIL, 7 omisiones documentadas (1373 unitarias y 619 integraciones). Preview f067058: 104/104 y 5/5 adicionales de pantallas críticas, con 22 análisis axe WCAG 2.2 A/AA sin infracciones. Chromium completo anterior al último aviso REST: 350/350; Edge dirigido: 105/105; WebKit completo anterior al tooltip: 349/349 y tooltip 15/15. El último cambio de aplicación pasa 5/5 adicionales en cada uno de esos tres navegadores. No se suman estas coberturas como si fueran una sola ejecución completa del último HEAD.

Preview validado: https://sql-select-e2uxkgvcr-jorge-gutierrez1.vercel.app, deployment dpl_JCzxJMZDNY6hKh5hrKZi3tNKtenE, código de aplicación f067058f8d886f1498d7a9bdd821d0503ef18e64. Los commits posteriores contienen únicamente QA y documentación; el HEAD final de Git se obtiene con git rev-parse HEAD. Producción conserva dpl_8EjVpuRWJfYvuqocHZR6nWA17ou2, commit 874f7748acf030f62dbb02bbaea0b204bdd36441. No se declara smoke de producción.

Oracle 19c cubre S1; las secciones completas se comprobaron en Free. RESPONSIVE_PASS cubre viewport y reflujo equivalente; zoom nativo queda NOT_TESTED. ACCESSIBILITY_PASS describe verificación automática y teclado, no certificación ni lector de pantalla manual. El build local usa configuración pública real de Production y credenciales privadas locales; ocho variables sensibles devueltas como [SENSITIVE] por Vercel no se utilizan como credenciales. No sustituye una prueba de runtime de Production. Una navegación WebKit S2 excedió cinco segundos; tres repeticiones y la secuencia posterior pasan sin cambiar esa aserción. Su causa puntual queda sin determinar y su fallo histórico permanece registrado.

La fase técnica termina verificada y sincronizada; el gate operativo permanece bloqueado. La implementación de fases 1–4 está conservada; AUTH_COMPLETE incluye entrega remota y por ello es false.

```text
PHASE_1_COMPLETE = true
PHASE_2_COMPLETE = true
PHASE_3_COMPLETE = true
PHASE_4_COMPLETE = true
PHASE_5_COMPLETE = false
CURRICULUM_COMPLETE = true
QUESTION_BANK_150_COMPLETE = true
AUTH_COMPLETE = false
ASSESSMENTS_COMPLETE = true
TEACHER_PANEL_COMPLETE = true
SUPERVISION_COMPLETE = true
ORACLE_VALIDATED = true
SUPABASE_VALIDATED = true
REACT_BITS_INTEGRATION_COMPLETE = true
RESPONSIVE_PASS = true
ACCESSIBILITY_PASS = true
SECURITY_PASS = true
PERFORMANCE_PASS = true
CONCURRENCY_PASS = true
CHROMIUM_PASS = true
EDGE_PASS = true
WEBKIT_PASS = true
FIREFOX_STATUS = NOT_TESTED_RUNTIME
EMAIL_REMOTE_STATUS = BLOCKED_SMTP_UNKNOWN
MICROSOFT_STATUS = BLOCKED_EXTERNAL_CONFIGURATION
PREVIEW_PASS = true
PRODUCTION_SMOKE_PASS = NOT_TESTED
FINAL_UX_READY = true
FINAL_RELEASE_READY = false
```

Indicadores operativos conservados:

```text
PHASE_5_COMPLETE = false
PRODUCTION_READY = BLOCKED
PRODUCTION_DEPLOYED = false
SECTION_1_PASS = true
SECTION_2_PASS = true
SECTION_3_PASS = true
QUESTION_BANK_S1 = 50
QUESTION_BANK_S2 = 50
QUESTION_BANK_S3 = 50
QUESTION_BANK_TOTAL = 150
GUEST_AUTH_PASS = true
EMAIL_AUTH_PASS = BLOCKED
MICROSOFT_AUTH = BLOCKED
PROFILE_PASS = true
ROLES_PASS = true
RLS_PASS = true
PROGRESS_SYNC_PASS = true
STUDENT_DASHBOARD_PASS = true
TEACHER_DASHBOARD_PASS = true
ASSESSMENT_CREATE_PASS = true
ASSESSMENT_PUBLISH_PASS = true
ASSESSMENT_ATTEMPT_PASS = true
ASSESSMENT_AUTOSAVE_PASS = true
ASSESSMENT_TIMER_PASS = true
ASSESSMENT_GRADING_PASS = true
ASSESSMENT_FEEDBACK_PASS = true
ASSESSMENT_MONITOR_PASS = true
ASSESSMENT_EXPORT_PASS = true
LAB_PASS = true
CHALLENGE_S1_PASS = true
CHALLENGE_S2_PASS = true
CHALLENGE_S3_PASS = true
LIVE_ROOM_PASS = true
ORACLE_FREE_PASS = true
ORACLE_19C = true
REACT_BITS_PASS = true
RESPONSIVE_PASS = true
ACCESSIBILITY_AUTOMATED_PASS = true
KEYBOARD_PASS = true
SCREEN_READER_MANUAL = NOT_TESTED
SECURITY_PASS = true
PERFORMANCE_PASS = true
CONCURRENCY_40_PASS = true
CHROMIUM_E2E = true
FIREFOX_E2E = BLOCKED
WEBKIT_E2E = true
EDGE_E2E = true
PREVIEW_SMOKE = true
PRODUCTION_SMOKE = NOT_TESTED
FINAL_DB_LAB_READY = false
```
