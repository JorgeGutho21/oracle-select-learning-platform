# Guía docente — DB LAB

1. Regístrate, confirma el correo e inicia sesión. El responsable debe asignarte el rol docente con la herramienta privilegiada documentada en [AUTH_ARCHITECTURE](AUTH_ARCHITECTURE.md); el perfil no permite cambiar de rol.
2. Abre **Profesor → Banco de preguntas**. Sincroniza el banco oficial: 50 preguntas de Fundamentos SQL, 50 de Consultas relacionales y 50 de PL/SQL. La sincronización es idempotente.
3. En **Evaluaciones → Nueva evaluación**, elige sección y temas. Puedes seleccionar preguntas manualmente o pedir una selección automática equivalente. Define duración, fechas, audiencia, intentos y feedback.
4. Guarda el borrador y revísalo antes de publicar. Publicar congela preguntas y pesos para los intentos; editar el banco no cambia una evaluación ya publicada.
5. Abre **Monitor** para ver inicio, avance, tiempo y eventos del navegador. En móvil cambia el grupo de columnas con las pestañas. Los eventos no prueban fraude ni detectan otros dispositivos.
6. Puedes cerrar nuevos accesos o finalizar la evaluación mediante las confirmaciones de la pantalla. Consulta **Resultados**, abre cada intento y revisa respuestas y eventos.
7. Decide cuándo liberar solo la nota o el feedback completo. La nota va de 0.0 a 5.0, con una decimal; el umbral habitual es 3.0. La base calcula los pesos.
8. Exporta CSV normal o **Excel en español**: el segundo usa punto y coma y coma decimal. Conserva los datos según la política académica de la institución.

Para una clase sin evaluación formal, usa **Iniciar clase**, **Laboratorio**, los Challenges por sección o **En vivo** con QR. El laboratorio distingue referencia didáctica de ejecución Oracle real. La sala tiene su propia clave de facilitación y no sustituye al rol docente de cuentas.

Detalles de campos, supervisión y calificación: [ASSESSMENT_TEACHER_GUIDE](ASSESSMENT_TEACHER_GUIDE.md). No compartas claves privilegiadas, wallets ni credenciales de Supabase.

Estado de esta entrega: Fase 5 publicada y evaluaciones verificadas en Production con cuentas QA propias. Implementación de acceso por correo probada; entrega remota pendiente de SMTP externo, confirmado desactivado. Microsoft permanece desactivado. El responsable debe configurar SMTP y verificar un buzón autorizado antes de usar registro/recuperación por correo con estudiantes. El rol de la primera cuenta docente real requiere asignación autorizada; no se inventó esa identidad.
