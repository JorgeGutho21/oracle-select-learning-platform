# Infraestructura

Futuros adaptadores para contratos de aplicación y dominio: Oracle, persistencia,
identidad, tiempo real, reloj y almacenamiento local. Ningún componente visual
importa directamente un adaptador concreto.

No contiene clientes de Supabase, drivers Oracle, credenciales, simuladores,
migraciones ni servicios en esta fase. La composición de adaptadores de servidor
se definirá al incorporar un caso de uso real, protegiendo los secretos.
