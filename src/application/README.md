# Aplicación

Casos de uso y contratos (puertos) independientes de React y de proveedores:
ejecutar consulta, inscribir, iniciar/cerrar ronda, enviar intento y leer resultados.

Depende del dominio. Los contratos necesarios para infraestructura se declaran
aquí o en `features/<modulo>/application`; los adaptadores los implementan
mediante inyección explícita. No importa clientes de Supabase, Oracle ni
componentes, y no inventa casos de uso sin un consumidor real.

Casos de uso implementados: el motor de práctica individual del Challenge
(`features/challenge/application`) y «ejecutar consulta» del laboratorio
(`features/laboratory/application`). El contrato compartido del servicio Oracle
es `oracle-executor.ts`.
