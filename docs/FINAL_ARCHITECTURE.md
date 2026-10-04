# Arquitectura final de DB LAB — Fase 5

Base verificada: `6fda02bec66f4ef5f0837ef0efda5cdd7587b787`. Se conserva la arquitectura de las fases 1–4. Los contratos completos siguen en [ARCHITECTURE](ARCHITECTURE.md), [AUTH_ARCHITECTURE](AUTH_ARCHITECTURE.md), [ASSESSMENT_ARCHITECTURE](ASSESSMENT_ARCHITECTURE.md) y [CURRICULUM_ARCHITECTURE](CURRICULUM_ARCHITECTURE.md).

| Responsabilidad | Ubicación y regla                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Presentación    | `src/presentation` y `features/*/presentation`: componentes, accesibilidad y representación. No decide notas ni permisos. |
| Aplicación      | Casos de uso, validación de formularios, DTO y coordinación.                                                              |
| Dominio         | SQL educativo, currículo, preguntas, progreso y reglas; independiente de Next y Supabase.                                 |
| Infraestructura | Adaptadores Oracle, Supabase, HTTP y almacenamiento local.                                                                |
| Composición     | `src/composition`: conecta puertos y adaptadores; solo `src/app` importa esta raíz.                                       |
| App Router      | Rutas y Server Functions delgadas, sesión verificada y autorización en cada operación.                                    |

ESLint comprueba las dependencias entre capas. Next, React, Bootstrap 5.3.8, Sass local y TypeScript strict permanecen fijados en el lockfile; no se reconstruyó el proyecto ni se añadió otra biblioteca de efectos.

El currículo es una fuente única: 25/25/28 lecciones y 50 preguntas oficiales por sección. Los ejemplos de S2/S3 usan resultados cuya huella se contrasta con Oracle real; las pantallas identifican la referencia didáctica. El laboratorio Oracle recibe exclusivamente SQL canónico construido a partir del AST permitido, nunca un POST de SQL arbitrario.

Supabase administra identidad, progreso, presencia, evaluaciones y sala; Oracle ejecuta SQL. Las migraciones de cuentas y evaluaciones se añadieron a la base remota mediante una transacción con TLS verificado, conservando los registros previos de sala. Las 18 tablas públicas tienen RLS. El navegador no importa respuestas correctas del banco; `attempt_view` limita el contenido según sesión y modo de feedback.

El autoguardado conserva revisiones por respuesta y una cola local. El servidor decide la hora, vencimiento y nota; cambiar el reloj del dispositivo o reenviar una revisión antigua no altera esta autoridad. El contador combina la última hora del servidor, conservando sus milisegundos, con tiempo monotónico transcurrido; cada nueva referencia lo resincroniza. Los eventos describen señales observables del navegador, sin inferir fraude ni acceder a hardware.

La Fase 5 incorpora `RecordTable`, compartido por estudiantes, monitor y resultados: una tabla completa en contenedores amplios y grupos de columnas con identidad y navegación de teclado en contenedores estrechos. Se mantienen los tokens del sistema y los datos reales.

QA local usa `.env.qa.local` con validación de loopback; los tests de 40 clientes no pueden usar producción por defecto. QA de preview se habilita explícitamente y verifica proyecto, estado READY y target distinto de producción antes de crear usuarios. Envía el bypass en una única petición sin redirecciones automáticas. Si Vercel responde 307 tras fijar la cookie, se permite un único salto comprobado al mismo origen, sin reenviar el header; las cookies privadas y las trazas remotas no se publican.
