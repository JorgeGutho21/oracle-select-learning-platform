# Infraestructura

Adaptadores para contratos de aplicación y dominio: Oracle, persistencia,
identidad, tiempo real, reloj y almacenamiento local. Ningún componente visual
importa directamente un adaptador concreto.

Adaptador Oracle en `infrastructure/oracle`: `UnconfiguredOracleExecutor`, que
declara que no hay conexión (R1 pendiente) y nunca simula resultados.

Adaptadores del Challenge, en `features/challenge/infrastructure`: almacenamiento
local de la práctica, corrección en proceso con las rúbricas privadas, reloj del
sistema e identificadores. No hay clientes de Supabase, drivers Oracle conectados,
credenciales, simuladores de Oracle ni migraciones. La composición de
adaptadores vive en `src/composition`; el evaluador con rúbricas solo se ejecuta
en el servidor mediante Server Functions.
