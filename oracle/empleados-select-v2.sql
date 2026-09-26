-- Dataset educativo empleados-select-v2 (DATABASE_SCHEMA.md). Se ejecuta en el esquema
-- propietario (SQL_LAB_V2_OWNER), nunca con la cuenta lectora. Los valores coinciden con
-- src/domain/dataset/empleados.ts; una prueba unitaria lo verifica.
-- Las fechas usan literales DATE 'AAAA-MM-DD': no dependen de NLS_DATE_FORMAT.

CREATE TABLE EMPLEADOS (
  ID_EMPLEADO NUMBER(4) CONSTRAINT EMPLEADOS_PK PRIMARY KEY CONSTRAINT EMPLEADOS_ID_POSITIVO CHECK (ID_EMPLEADO > 0),
  NOMBRE VARCHAR2(40 CHAR) NOT NULL,
  APELLIDO VARCHAR2(40 CHAR) NOT NULL,
  CARGO VARCHAR2(40 CHAR) NOT NULL,
  DEPARTAMENTO VARCHAR2(30 CHAR) NOT NULL,
  CIUDAD VARCHAR2(30 CHAR) NOT NULL,
  SALARIO NUMBER(10) NOT NULL CONSTRAINT EMPLEADOS_SALARIO_POSITIVO CHECK (SALARIO > 0),
  BONO NUMBER(10) CONSTRAINT EMPLEADOS_BONO_NO_NEGATIVO CHECK (BONO >= 0),
  FECHA_INGRESO DATE NOT NULL,
  ESTADO VARCHAR2(8 CHAR) NOT NULL CONSTRAINT EMPLEADOS_ESTADO CHECK (ESTADO IN ('ACTIVO', 'INACTIVO')),
  CORREO VARCHAR2(60 CHAR) NOT NULL CONSTRAINT EMPLEADOS_CORREO_UNICO UNIQUE,
  ID_JEFE NUMBER(4) CONSTRAINT EMPLEADOS_JEFE_FK REFERENCES EMPLEADOS (ID_EMPLEADO)
);

INSERT INTO EMPLEADOS VALUES (1, 'Ana', 'Rojas', 'Gerente general', 'Operaciones', 'Bogotá', 9000000, 900000, DATE '2012-02-01', 'ACTIVO', 'ana.rojas@empresa.example', NULL);
INSERT INTO EMPLEADOS VALUES (2, 'Carlos', 'Gómez', 'Líder de área', 'TI', 'Bogotá', 7500000, 600000, DATE '2014-06-16', 'ACTIVO', 'carlos.gomez@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (3, 'María', 'Ruiz', 'Líder de área', 'Ventas', 'Medellín', 6000000, 500000, DATE '2015-03-02', 'ACTIVO', 'maria.ruiz@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (4, 'Jorge', 'Díaz', 'Líder de área', 'Finanzas', 'Cali', 6800000, NULL, DATE '2016-09-12', 'ACTIVO', 'jorge.diaz@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (5, 'Laura', 'Mora', 'Líder de área', 'Recursos Humanos', 'Bogotá', 5800000, 400000, DATE '2017-01-23', 'ACTIVO', 'laura.mora@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (6, 'Andrés', 'Pérez', 'Analista', 'TI', 'Bogotá', 4200000, 300000, DATE '2019-04-08', 'ACTIVO', 'andres.perez@empresa.example', 2);
INSERT INTO EMPLEADOS VALUES (7, 'Paula', 'Castro', 'Analista', 'TI', 'Medellín', 4200000, NULL, DATE '2020-08-03', 'ACTIVO', 'paula.castro@empresa.example', 2);
INSERT INTO EMPLEADOS VALUES (8, 'Oscar', 'Vega', 'Analista', 'TI', 'Cali', 3800000, 250000, DATE '2021-02-15', 'INACTIVO', 'oscar.vega@empresa.example', 2);
INSERT INTO EMPLEADOS VALUES (9, 'Sofía', 'López', 'Representante comercial', 'Ventas', 'Medellín', 3000000, 450000, DATE '2018-11-19', 'ACTIVO', 'sofia.lopez@empresa.example', 3);
INSERT INTO EMPLEADOS VALUES (10, 'Mario', 'Soto', 'Representante comercial', 'Ventas', 'Bogotá', 3500000, 0, DATE '2019-07-01', 'ACTIVO', 'mario.soto@empresa.example', 3);
INSERT INTO EMPLEADOS VALUES (11, 'Valentina', 'Ríos', 'Representante comercial', 'Ventas', 'Cali', 2900000, 350000, DATE '2022-05-09', 'ACTIVO', 'valentina.rios@empresa.example', 3);
INSERT INTO EMPLEADOS VALUES (12, 'Ricardo', 'Herrera', 'Representante comercial', 'Ventas', 'Barranquilla', 3500000, NULL, DATE '2023-01-16', 'ACTIVO', 'ricardo.herrera@empresa.example', 3);
INSERT INTO EMPLEADOS VALUES (13, 'Camila', 'Cruz', 'Analista', 'Finanzas', 'Cali', 4500000, 200000, DATE '2020-03-10', 'ACTIVO', 'camila.cruz@empresa.example', 4);
INSERT INTO EMPLEADOS VALUES (14, 'Diego', 'Ortiz', 'Analista', 'Finanzas', 'Bogotá', 5200000, 300000, DATE '2016-10-24', 'INACTIVO', 'diego.ortiz@empresa.example', 4);
INSERT INTO EMPLEADOS VALUES (15, 'Daniela', 'Suárez', 'Especialista', 'Finanzas', 'Medellín', 6100000, 350000, DATE '2015-12-01', 'ACTIVO', 'daniela.suarez@empresa.example', 4);
INSERT INTO EMPLEADOS VALUES (16, 'Julián', 'Luna', 'Asistente', 'Recursos Humanos', 'Cali', 2300000, NULL, DATE '2024-02-05', 'ACTIVO', 'julian.luna@empresa.example', 5);
INSERT INTO EMPLEADOS VALUES (17, 'Carolina', 'Vargas', 'Analista', 'Recursos Humanos', 'Medellín', 3900000, 150000, DATE '2021-09-13', 'ACTIVO', 'carolina.vargas@empresa.example', 5);
INSERT INTO EMPLEADOS VALUES (18, 'Felipe', 'Mejía', 'Asistente', 'Operaciones', 'Bogotá', 2100000, NULL, DATE '2025-01-20', 'ACTIVO', 'felipe.mejia@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (19, 'Alicia', 'Paz', 'Especialista', 'Operaciones', 'Valledupar', 4800000, 250000, DATE '2013-05-06', 'INACTIVO', 'alicia.paz@empresa.example', 1);
INSERT INTO EMPLEADOS VALUES (20, 'Esteban', 'Torres', 'Asistente', 'TI', 'Barranquilla', 2500000, NULL, DATE '2025-03-03', 'ACTIVO', 'esteban.torres@empresa.example', NULL);

COMMIT;
