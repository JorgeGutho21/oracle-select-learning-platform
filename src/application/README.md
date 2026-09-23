# Aplicación

Futuros casos de uso y contratos (puertos) independientes de React y de proveedores:
ejecutar consulta, inscribir, iniciar/cerrar ronda, enviar intento y leer resultados.

Depende del dominio. Los contratos necesarios para infraestructura se declaran
aquí; los adaptadores los implementan mediante inyección explícita. No importa
clientes de Supabase, Oracle ni componentes. Esta entrega no inventa casos de uso
o interfaces que aún no tengan un consumidor real.
