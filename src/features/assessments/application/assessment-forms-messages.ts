/** Mensajes para los códigos de problema que devuelve la base (sin dependencias). */

export const ASSESSMENT_PROBLEM_MESSAGE: Readonly<Record<string, string>> = {
  questions: 'Elige al menos una pregunta del banco.',
  'questions-unavailable':
    'Alguna pregunta elegida ya no está publicada o es de otra sección. Revisa la selección.',
  'count-exceeds-selection': 'La cantidad de preguntas supera las elegidas.',
  'pool-too-small': 'No hay suficientes preguntas publicadas en el banco para esa cantidad.',
  students: 'Elige al menos un estudiante.',
  'closes-in-past':
    'La fecha de cierre ya pasó o está demasiado cerca. Cámbiala antes de publicar.',
  data: 'Algún dato no es válido. Revisa el formulario.',
};

export const QUESTION_PROBLEM_MESSAGE: Readonly<Record<string, string>> = {
  'options-count': 'Escribe entre 2 y 8 opciones.',
  'option-body': 'Hay una opción vacía.',
  'option-table': 'Una opción de tipo tabla necesita su tabla.',
  'single-correct': 'Marca exactamente una opción correcta.',
  'multiple-correct': 'Marca al menos una correcta y deja al menos una incorrecta.',
  'order-permutation': 'Numera los fragmentos del 1 al total, sin repetir.',
  data: 'Algún dato no es válido. Revisa el formulario.',
  status: 'Estado no válido.',
};
