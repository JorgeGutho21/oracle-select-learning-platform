import { z } from 'zod';
import { SECTION_IDS, SECTION_MODE_IDS } from '@/features/sections/domain/sections';
import { PROGRESS_STATUSES } from '../domain/progress';
import { MAX_UPLOAD_RECORDS } from './progress-wire';

export { MAX_UPLOAD_RECORDS };

/**
 * Contrato de `/api/progress`. Esta forma la comparten navegador y servidor; el servidor
 * además comprueba cada registro contra el registro canónico (`isTrackedKey`): una
 * petición fabricada no puede inventar lecciones, secciones ni estados.
 */

const stateValue = z.union([z.number(), z.string().max(64), z.boolean()]);

export const progressRecordSchema = z.object({
  section: z.enum(SECTION_IDS),
  mode: z.enum(SECTION_MODE_IDS),
  item: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/),
  status: z.enum(PROGRESS_STATUSES),
  percent: z.number().int().min(0).max(100),
  contentVersion: z.number().int().min(0).max(1_000_000).nullable(),
  state: z
    .record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,31}$/), stateValue)
    .refine((value) => Object.keys(value).length <= 8, 'Demasiados datos de posición.'),
  lastActivityAt: z.number().int().min(0),
});

export const progressUploadSchema = z.object({
  records: z.array(progressRecordSchema).min(1).max(MAX_UPLOAD_RECORDS),
});

export const progressResetSchema = z.object({
  section: z.enum(SECTION_IDS),
  mode: z.enum(SECTION_MODE_IDS),
});

/** Zona de presencia: la calcula el navegador (`presenceArea`) y aquí se valida. */
export const presenceSchema = z.object({
  area: z.string().regex(/^[a-z0-9][a-z0-9:/-]{0,79}$/),
});
