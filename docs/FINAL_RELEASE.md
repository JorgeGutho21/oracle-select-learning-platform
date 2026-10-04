# Release de DB LAB — Fase 5

**Candidato en verificación; producción no promovida.** Este documento se actualiza con la evidencia de cierre, sin convertir una configuración externa pendiente en un PASS.

Rama: `codex-phase5-production-final-20261004`. Base: `6fda02bec66f4ef5f0837ef0efda5cdd7587b787`; `889716c` es ancestro verificado. Checkpoint anterior conservado: `01e83ac`. `main` y el DOCX personal permanecen intactos.

Se corrigieron la identidad de Amilkar Sierra Romano, el resumen real de 78 lecciones, la metadata futura de S1, las tablas docentes en móvil y el CSV para Excel español, incluida la neutralización de fórmulas con prefijos de control. Se preservaron las funcionalidades de las fases 1–4, el sistema visual y los cuatro efectos React Bits gratuitos.

Las dos migraciones aditivas de cuentas/evaluaciones están aplicadas al Supabase remoto, 18 tablas con RLS, sin pérdida de las salas anteriores. El banco contiene 50 preguntas oficiales por sección: 150. Oracle Free verificó currículo SQL/PLSQL, incluidos triggers antes/después; Oracle Cloud 19c verificó únicamente S1.

Evidencia detallada: [FINAL_QA_REPORT](FINAL_QA_REPORT.md). Arquitectura: [FINAL_ARCHITECTURE](FINAL_ARCHITECTURE.md). Seguridad y límites: [SECURITY_FINAL](SECURITY_FINAL.md). URLs, commits desplegados, configuración externa y rollback: [PRODUCTION_DEPLOYMENT](PRODUCTION_DEPLOYMENT.md). Operación: [TEACHER_GUIDE](TEACHER_GUIDE.md), [STUDENT_GUIDE](STUDENT_GUIDE.md).

## Gates y pendientes

Correo remoto: configuración y entrega sin verificar; requiere un buzón autorizado y las pruebas de confirmación/recuperación. Microsoft está desactivado en el proyecto. Firefox oficial no arranca en este Windows por un ensamblado `mozglue` ausente; no se atribuye a la aplicación. Zoom nativo, lector de pantalla, móvil físico y proyector: NOT_TESTED. El reflujo equivalente a zoom se valida por separado.

El encargo final admite correo remoto BLOCKED_EXTERNAL_CONFIGURATION únicamente si se confirma que falta SMTP externo y la implementación está validada por otros medios. Su configuración sigue desconocida, por lo que todavía no se cumple esa excepción. Microsoft sin credenciales y Firefox con limitación demostrada del runtime son excepciones admitidas. El candidato Preview debe pasar la QA remota con datos temporales propios y limpieza por UUID; los 40 clientes se prueban solo en local. Ningún P0/P1 real permite promover.

## Indicadores de cierre

Resultados locales y de base remota ejecutados, con el alcance de FINAL_QA_REPORT. WebKit y Preview siguen en verificación; las banderas se actualizarán con sus resultados. Oracle 19c cubre S1; las secciones completas se comprobaron en Free. RESPONSIVE_PASS cubre la matriz de viewport y reflujo equivalente; el zoom nativo queda NOT_TESTED. No se considera completada la Fase 5.

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
WEBKIT_E2E = NOT_TESTED
EDGE_E2E = true
PREVIEW_SMOKE = NOT_TESTED
PRODUCTION_SMOKE = NOT_TESTED
FINAL_DB_LAB_READY = false
```
