# Videos de la unidad

Archivos entregados por el autor el 24 de septiembre de 2026. Se copiaron sin volver a codificarlos; el nombre original figura en la tabla. Ambos llevan la marca de agua «Gemini Notebook», la herramienta con la que se produjeron.

| Archivo                              | Original                                  | Uso                                         | Duración | Imagen            | Tamaño  |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------- | -------- | ----------------- | ------- |
| `introduccion-select-oracle-sql.mp4` | `Introducción_a_SELECT_en_Oracle_SQL.mp4` | V01, introducción: Home, inicio de `/learn` | 1:13     | 720 × 1280 (9:16) | 9,5 MB  |
| `resumen-fundamentos-oracle-sql.mp4` | `Fundamentos_de_Oracle_SQL.mp4`           | V02, resumen: final de `/learn`, escena 14  | 4:51     | 1280 × 720 (16:9) | 21,0 MB |

Los dos videos están codificados en H.264 High 3.1 y AAC mono a 44,1 kHz, en contenedor MP4 (`mp42`). El índice `moov` está al inicio del archivo, así que la reproducción empieza sin descargar el video completo. El introductorio va a 30 fps y el resumen a 24 fps.

Las portadas `*.jpg` son fotogramas de cada video a su resolución original: el segundo 0,1 del introductorio y el 5 del resumen.

SHA-256:

- `introduccion-select-oracle-sql.mp4`: `f1e28a88d5bccd4739c48740da78c7c22981db18f0afc366baffc592ea5d9a73`
- `resumen-fundamentos-oracle-sql.mp4`: `d828323376f46bee7a3472fd95f2db3f3d7f6512854d1ad67dcd2be57c8787dd`

**Subtítulos:**

- El introductorio lleva subtítulos incrustados en la imagen. No tiene pista aparte, porque se verían duplicados.
- El resumen tiene la pista `resumen-fundamentos-oracle-sql.es.vtt` (110 subtítulos) y la transcripción `resumen-fundamentos-oracle-sql.transcripcion.txt`. Salen de una transcripción automática local con Whisper small, revisada a mano:
  - términos SQL escritos como en las lecciones;
  - «salario hasta el disco 12» corregido a «SALARIO*12»;
  - otras palabras mal reconocidas;
  - una frase duplicada eliminada.

  La revisión se hizo contra las diapositivas y la sincronía con los fotogramas. Conviene una escucha final del autor.

**Contenido:** las tablas de ejemplo de ambos videos no son el dataset `empleados-select-v1`: tienen correo, saldo y otras filas. Las descripciones lo advierten. El resumen muestra además tres rótulos en inglés en su cierre.

Configuración y descripciones: `src/features/resources/domain/videos.ts`.
