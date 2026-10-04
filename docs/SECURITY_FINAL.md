# Seguridad final — Fase 5

Las políticas detalladas permanecen en [ASSESSMENT_SECURITY](ASSESSMENT_SECURITY.md). Este documento registra la verificación y los límites reales.

| Control      | Evidencia ejecutada                                                                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles        | RPC privilegiada; cambiar metadatos o editar el perfil no concede rol docente. Pruebas remotas de cuentas: 7/7.                                                                                                       |
| RLS          | 18 tablas habilitadas; anónimo sin filas; estudiante B no obtiene el intento A, banco ni respuestas. Smoke remoto: 5/5.                                                                                               |
| Evaluación   | Corrección y tiempo en PostgreSQL, snapshots de preguntas, revisiones monotónicas, doble entrega idempotente y feedback oculto hasta autorización.                                                                    |
| CSV          | UTF-8 con BOM; dialecto Excel español con `;` y coma decimal. Neutraliza fórmulas y prefijos de tabulación/salto de línea. Regresiones unitarias añadidas.                                                            |
| SQL          | AST con alcance y límites, sentencia canónica, cuenta lectora Oracle, sin `eval` ni SQL libre desde el cliente.                                                                                                       |
| Navegador    | CSP, DENY, nosniff, referrer, HSTS y política sin cámara, micrófono ni ubicación. CSP permite únicamente el origen Supabase configurado en el build y su WebSocket.                                                   |
| Credenciales | Cero coincidencias de 17 valores privados en repo, `.next/static` y últimos 15 commits. Incluye token y refresh token de Vercel. Variables locales, wallets y artefactos excluidos también de Vercel.                 |
| Preview      | Bypass en una petición del proyecto Preview READY verificado; redirección 307 únicamente al mismo origen, mediante cookie y sin reenviar el header. Cookies fuera de Git, sin header global ni traza que las exponga. |

El limitador de autenticación del proceso complementa los controles de Supabase, pero no es un limitador distribuido entre instancias serverless. No equivale a protección global contra ataques masivos. La CSP necesita `unsafe-inline` por la hidratación estática de Next; no admite `unsafe-eval` en producción. No se declara una auditoría externa de penetración.

El login permite 300 intentos por IP y 10 por cuenta en diez minutos; el registro, 120 por IP y 5 por cuenta; recuperación, 60 y 5. El margen por IP no impide por configuración una clase de 40 cuentas distintas. La medición de 40 logins ejercita GoTrue local directamente, no 40 navegadores ni 40 Server Functions simultáneas. Sus resultados no acreditan un limitador distribuido ni un SLA.

El Preview corregido `81a10fc`, verificado como READY del proyecto propio, se auditó en 11 respuestas y 26 archivos JavaScript: cero coincidencias de los 17 valores privados conocidos y cero referencias a source maps. La comparación incluye contraseñas dentro de URI privadas, además de tokens, claves y cartera. Es una comprobación de valores conocidos; no se presenta como prueba de penetración completa.

Los 40 clientes se probaron únicamente en Supabase local. No se aplicó carga externa a producción. La limpieza remota se limita a UUID creados por esta QA; se conserva el banco oficial de 150 preguntas y los datos anteriores de sala. Los adjuntos personales y secretos no se versionan.

Microsoft queda condicionado a la configuración de Azure y Supabase. Confirmación y recuperación de correo se verifican con Mailpit local; su entrega remota necesita SMTP propio y un buzón autorizado. Estos límites deben aparecer en el estado del release.
