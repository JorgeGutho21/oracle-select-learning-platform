# Guía del profesor: evaluaciones en DB LAB

Para el profesor Amilkar Sierra Romano y cualquier cuenta con el rol de profesor. El rol se
asigna como explica [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md) (nunca desde la interfaz).

## 1. Dónde está

Panel docente → **Evaluaciones** (`/teacher/assessments`) y **Banco de preguntas**
(`/teacher/questions`). «Resumen y estudiantes» sigue siendo la vista del grupo de la Fase 2.

## 2. Preparar el banco (una vez)

1. Abre **Banco de preguntas**.
2. Pulsa **Sincronizar banco oficial de DB LAB**. Se añaden las 50 preguntas de Fundamentos
   SQL. Puedes repetirlo cuando DB LAB publique cambios: solo actualiza lo que cambió.
3. Opcional: **Nueva pregunta** para crear las tuyas (cualquier sección) o **Duplicar como
   borrador propio** sobre una oficial para adaptarla. Solo las publicadas se pueden usar.
4. **Retirar** quita una pregunta de las evaluaciones nuevas sin borrarla.

## 3. Crear una evaluación

**Nueva evaluación**:

- **Datos:** nombre, descripción y sección.
- **Preguntas:**
  - _Selección manual:_ eliges las preguntas. Si eliges más de las que tendrá cada examen
    (por ejemplo 30 para un examen de 20), cada estudiante recibe 20 de ellas.
  - _Selección automática:_ marcas temas (o ninguno = todos) y la cantidad. Cada estudiante
    recibe una selección equivalente en dificultad y temas.
- **Cantidad:** cualquier número de 1 a 100 (sugeridas 10, 20, 30, 40 y 50).
- **Tiempo:** duración en minutos, apertura y cierre opcionales (hora de Colombia), intentos
  permitidos.
- **Orden:** preguntas y opciones al azar para cada estudiante.
- **Al entregar ve:** retenida, solo la nota, nota y respuestas, o todo con explicación.
- **Participantes:** todos los estudiantes o los que elijas; opción «solo correo
  institucional confirmado».
- **Supervisión:** registrar o no copiar, pegar y menú contextual.
- **Nota mínima** para aprobar (3.0 por defecto).

**Guardar borrador** no publica. Revisa la ficha y, cuando esté lista, **Publicar…** →
**Publicar evaluación**. Al publicar, las preguntas se congelan: si después editas el banco,
esta evaluación no cambia. Una evaluación publicada no se edita: **Duplicar** crea un
borrador igual.

## 4. Durante el examen

- **Supervisar** muestra a cada estudiante: estado, pregunta actual, progreso, tiempo
  restante, conexión, último evento y el recuento de eventos («2 pérdidas de foco»). Se
  actualiza solo (en vivo con Supabase Realtime).
- Los eventos son señales del navegador, no pruebas de fraude: una pérdida de foco puede ser
  una notificación o un cambio de ventana. Interprétalos con el contexto.
- **Cerrar nuevos accesos:** nadie más puede comenzar; quien ya empezó sigue hasta su tiempo.
- **Finalizar evaluación:** cierra ahora y entrega (y califica) los intentos abiertos con lo
  que tengan guardado. No se puede deshacer.
- Si un estudiante pierde la conexión o recarga, vuelve al mismo examen; el reloj no se
  detiene. Al terminar su tiempo, la evaluación se entrega sola.

## 5. Resultados

- Resumen en escala 0.0–5.0: participantes, entregados, en curso, ausentes, promedio, mediana,
  máxima, mínima, distribución y aprobación. **Ausente** (no comenzó) no es 0.0.
- Tabla por estudiante y **Ver intento**: sus respuestas frente a la clave y la línea de tiempo
  de eventos.
- **Por pregunta:** porcentaje de acierto, dificultad observada y distractor frecuente. Si un
  distractor lo elige un cuarto o más del grupo, revisa si la pregunta es ambigua o si el
  concepto no quedó claro.

## 6. Retroalimentación y exportación

- En la ficha, **Retroalimentación para los estudiantes**: elige qué ven y pulsa **Aplicar**.
  Puedes liberarla o retenerla cuando quieras; queda en el historial.
- **Exportar CSV** (estándar), **CSV para Excel** (Excel en español) o **Detalle por
  pregunta**. Las columnas: nombre, apellido, correo, evaluación, sección, fecha, estado,
  inicio, entrega, duración, correctas, total, porcentaje y nota.

## 7. Buenas prácticas

- Publica con antelación y usa la apertura para que la evaluación aparezca «Programada».
- Para un parcial en el aula, deja el cierre unos minutos después del final de la clase: quien
  empiece tarde tendrá menos tiempo (el intento termina como mucho al cierre).
- Retén la retroalimentación hasta que todos hayan presentado si hay más de un grupo.
- No uses los eventos como única base para una sanción.
