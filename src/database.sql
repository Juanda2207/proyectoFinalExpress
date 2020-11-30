--TABLAS PARA EL FUNCIONAMIENTO DEL PROGRAMA, COPIE Y PEGUE EN EL QUERY TOOL DE PGADMIN.

DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS cargo_servidor_publico CASCADE;
DROP TABLE IF EXISTS ciudad CASCADE;
DROP TABLE IF EXISTS contacto_de_emergencia CASCADE;
DROP TABLE IF EXISTS doctor CASCADE;
DROP TABLE IF EXISTS email_contacto CASCADE;
DROP TABLE IF EXISTS entidad_promotora_de_salud CASCADE;
DROP TABLE IF EXISTS estado_paciente CASCADE;
DROP TABLE IF EXISTS geolocalizacion CASCADE;
DROP TABLE IF EXISTS informe CASCADE;
DROP TABLE IF EXISTS laboratorio CASCADE;
DROP TABLE IF EXISTS medicamento CASCADE;
DROP TABLE IF EXISTS paciente CASCADE;
DROP TABLE IF EXISTS rastreo CASCADE;
DROP TABLE IF EXISTS registro CASCADE;
DROP TABLE IF EXISTS registro_doctor CASCADE;
DROP TABLE IF EXISTS registro_dosis_medicamento CASCADE;
DROP TABLE IF EXISTS registro_medicamento CASCADE;
DROP TABLE IF EXISTS registro_paciente CASCADE;
DROP TABLE IF EXISTS servidor_publico CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS telefono_contacto CASCADE;
DROP TABLE IF EXISTS ubicacion_paciente CASCADE;
DROP TABLE IF EXISTS universidad_doctor CASCADE;
DROP TABLE IF EXISTS vivienda_doctor CASCADE;
DROP TABLE IF EXISTS doctor_asignado CASCADE;
DROP TABLE IF EXISTS personas_con_las_que_vive CASCADE;
DROP TABLE IF EXISTS estadisticas_barrio CASCADE;
DROP TABLE IF EXISTS estadisticas_edad CASCADE;
DROP TABLE IF EXISTS estadisticas_visitas CASCADE;

CREATE TABLE paciente(
    
    type_of_document VARCHAR(40) NOT NULL,
    patient_document VARCHAR(40),
    name1 VARCHAR(40) NOT NULL,
	name2 VARCHAR(40),
	lastname1 VARCHAR(40) NOT NULL,
	lastname2 VARCHAR(40),
	age VARCHAR(3) NOT NULL,
	people_in_the_house VARCHAR(40) NOT NULL,

	PRIMARY KEY(patient_document)
);

CREATE TABLE personas_con_las_que_vive(

	patient_document VARCHAR(4040),
	contact_document VARCHAR(4040),
	name1 VARCHAR(4040) NOT NULL,
	name2 VARCHAR(4040),
	lastname1 VARCHAR(4040) NOT NULL,
	lastname2 VARCHAR(4040),
	relationship VARCHAR(4040),

	PRIMARY KEY(patient_document, contact_document),
	FOREIGN KEY(patient_document) REFERENCES paciente(patient_document)
);


CREATE TABLE cargo_servidor_publico(
	
	position_ID SERIAL,
	position VARCHAR(40) NOT NULL,
	PRIMARY KEY(position_ID)
);

CREATE TABLE ciudad(
	
	city_ID SERIAL,
	possible_infection_city VARCHAR(40) NOT NULL,
	PRIMARY KEY (city_ID)
);

CREATE TABLE geolocalizacion(
	
	location_ID SERIAL,
	coordinates VARCHAR(40) NOT NULL,
	PRIMARY KEY (location_ID)
);

CREATE TABLE servidor_publico(

    
	public_worker_ID SERIAL,
	public_worker_document VARCHAR(40) UNIQUE NOT NULL,
	name1 VARCHAR(40) NOT NULL,
	name2 VARCHAR(40),
	lastname1 VARCHAR(40) NOT NULL,
	lastname2 VARCHAR(40),
	position_ID SERIAL,
	login_password VARCHAR(100) NOT NULL,
	

	PRIMARY KEY (public_worker_ID),
	FOREIGN KEY (position_ID) REFERENCES cargo_servidor_publico (position_ID)
);

CREATE TABLE ubicacion_paciente(
    
	patient_location_ID SERIAL,
	patient_document VARCHAR(40),
	patient_address VARCHAR(40) NOT NULL,
	neighborhood VARCHAR(40) NOT NULL,
	location_ID SERIAL,
	city_ID SERIAL,

	PRIMARY KEY (patient_location_ID),
    FOREIGN KEY (patient_document) REFERENCES paciente(patient_document),
	FOREIGN KEY (location_ID) REFERENCES geolocalizacion (location_ID),
	FOREIGN KEY (city_ID) REFERENCES ciudad (city_ID)
);

CREATE TABLE registro_paciente(

    
	register_date VARCHAR(40) NOT NULL,
	register_hour VARCHAR(40) NOT NULL,
	patient_document VARCHAR(40),
	public_worker_ID SERIAL,

	PRIMARY KEY (patient_document,public_worker_ID),
    FOREIGN KEY (patient_document) REFERENCES paciente(patient_document),
	FOREIGN KEY (public_worker_ID) REFERENCES servidor_publico (public_worker_ID)
);


CREATE TABLE contacto_de_emergencia(
    
    contact_ID SERIAL,
    patient_document VARCHAR(40),
	contact_document VARCHAR(40) NOT NULL,
    name1 VARCHAR(40) NOT NULL,
	name2 VARCHAR(40),
	lastname1 VARCHAR(40) NOT NULL,
	lastname2 VARCHAR(40),
	relationship VARCHAR(40) NOT NULL,

	PRIMARY KEY(contact_ID),
	FOREIGN KEY (patient_document) REFERENCES paciente(patient_document)
);

CREATE TABLE telefono_contacto(
	
	contact_ID SERIAL,
	phone VARCHAR(40),

	PRIMARY KEY(contact_ID),
	FOREIGN KEY (contact_ID) REFERENCES contacto_de_emergencia(contact_ID)
);

CREATE TABLE email_contacto(
	
	contact_ID SERIAL,
	email VARCHAR(40),
	
	PRIMARY KEY(contact_ID),
	FOREIGN KEY (contact_ID) REFERENCES contacto_de_emergencia(contact_ID)
);

CREATE TABLE universidad_doctor(
	
	university_ID SERIAL,
	university_name VARCHAR(40) NOT NULL,

	PRIMARY KEY (university_ID)
);

CREATE TABLE entidad_promotora_de_salud(
	
	entity_ID SERIAL,
	entity_name VARCHAR(40) NOT NULL,

	PRIMARY KEY (entity_ID)
);

CREATE TABLE doctor(
	
	type_of_document VARCHAR(4040) NOT NULL,
	doctor_document VARCHAR(40),
	name1 VARCHAR(40) NOT NULL,
	name2 VARCHAR(40),
	lastname1 VARCHAR(40) NOT NULL,
	lastname2 VARCHAR(20),
	university_ID SERIAL,
	entity_ID SERIAL,
	login_password VARCHAR(100) NOT NULL,

	PRIMARY KEY (doctor_document),
	FOREIGN KEY (university_ID) REFERENCES universidad_doctor(university_ID),
	FOREIGN KEY (entity_ID) REFERENCES entidad_promotora_de_salud(entity_ID)
);


CREATE TABLE doctor_asignado(
	
	asignation_ID SERIAL,
	doctor_document VARCHAR(40),
	patient_document VARCHAR(40),

	PRIMARY KEY(asignation_ID),
	FOREIGN KEY(doctor_document) REFERENCES doctor(doctor_document),
	FOREIGN KEY(patient_document) REFERENCES paciente(patient_document)
);

CREATE TABLE vivienda_doctor(
	
	doctor_document VARCHAR(40),
	doctor_address VARCHAR(40) NOT NULL,
	neighborhood VARCHAR(40) NOT NULL,

	PRIMARY KEY(doctor_document),
	FOREIGN KEY(doctor_document) REFERENCES doctor(doctor_document)
);

CREATE TABLE registro_doctor(

	doctor_document VARCHAR(40),
	public_worker_ID SERIAL,
	register_date VARCHAR(40) NOT NULL,
	register_hour VARCHAR(40) NOT NULL,

	PRIMARY KEY (doctor_document, public_worker_ID),
	FOREIGN KEY (doctor_document) REFERENCES doctor(doctor_document),
	FOREIGN KEY (public_worker_ID) REFERENCES servidor_publico(public_worker_ID)
);

CREATE TABLE medicamento(
	
    medicine_code SERIAL,
    medicine_name VARCHAR(40) NOT NULL, 

    PRIMARY KEY(medicine_code)
);

CREATE TABLE laboratorio(
	
    RUT VARCHAR(40) NOT NULL,
    lab_name VARCHAR(40) NOT NULL,
    lab_address VARCHAR(40) NOT NULL,

    PRIMARY KEY(RUT)
);

CREATE TABLE pedido(
	
    medicine_code SERIAL,
    RUT VARCHAR(40),
    doctor_document VARCHAR(40),
	quantity INT NOT NULL,

    PRIMARY KEY (medicine_code, RUT, doctor_document),
    FOREIGN KEY (medicine_code) REFERENCES medicamento(medicine_code),
    FOREIGN KEY (RUT) REFERENCES laboratorio(RUT),
    FOREIGN KEY (doctor_document) REFERENCES doctor(doctor_document)
);

CREATE TABLE stock(
	
    medicine_code SERIAL,
    RUT VARCHAR(40),
    quantity INT NOT NULL,

    PRIMARY KEY (medicine_code, RUT),
    FOREIGN KEY (medicine_code) REFERENCES medicamento(medicine_code),
    FOREIGN KEY (RUT) REFERENCES laboratorio(RUT)
);

CREATE TABLE registro(

    register_number SERIAL,
    patient_document VARCHAR(40),
    doctor_document VARCHAR(40),
    register_day VARCHAR(40) NOT NULL,
    register_month VARCHAR(40) NOT NULL,
    register_year VARCHAR(40) NOT NULL,
    register_hour VARCHAR(40) NOT NULL,

    PRIMARY KEY (register_number),
    FOREIGN KEY (patient_document) REFERENCES paciente(patient_document),
    FOREIGN KEY (doctor_document) REFERENCES doctor(doctor_document)
);

CREATE TABLE estado_paciente(
	
	register_number SERIAL,
	patient_weight VARCHAR(40) NOT NULL,
	patient_temperature VARCHAR(40) NOT NULL,
	blood_pressure VARCHAR(40) NOT NULL,
	observations VARCHAR(300),

	PRIMARY KEY (register_number),
	FOREIGN KEY (register_number) REFERENCES registro(register_number)
);

CREATE TABLE registro_dosis_medicamento(
	
	dose_ID SERIAL,
	dose VARCHAR(40) NOT NULL,

	PRIMARY KEY(dose_ID)
);


CREATE TABLE registro_medicamento(
	
	register_number SERIAl,
	medicine_name VARCHAR(40) NOT NULL,
	dose_ID SERIAl,

	PRIMARY KEY (dose_ID, register_number),
	FOREIGN KEY (register_number) REFERENCES registro(register_number),
	FOREIGN KEY (dose_ID) REFERENCES registro_dosis_medicamento(dose_ID)
);

CREATE TABLE informe(
	
    report_number SERIAL,
    report_date VARCHAR(40),
	report_hour VARCHAR(40),

    PRIMARY KEY (report_number)
);

CREATE TABLE estadisticas_barrio(
	
    report_number SERIAL,
    neighborhood_average VARCHAR(40),

    PRIMARY KEY (report_number),
	FOREIGN KEY (report_number) REFERENCES informe(report_number)
);


CREATE TABLE estadisticas_edad(
	
    report_number SERIAL,
    age_average VARCHAR(5),

    PRIMARY KEY (report_number),
	FOREIGN KEY (report_number) REFERENCES informe(report_number)
);

CREATE TABLE estadisticas_visitas(
	
    report_number SERIAL,
    diario VARCHAR(40),
	semanal VARCHAR(40),
	mensual VARCHAR(40),

    PRIMARY KEY (report_number),
	FOREIGN KEY (report_number) REFERENCES informe(report_number)
);




INSERT INTO laboratorio(RUT, lab_name, lab_address) VALUES('12345', 'CaliMed ltda.', 'Calle 20 #10-05');

INSERT INTO laboratorio(RUT, lab_name, lab_address) VALUES('33267', 'Valle Salud', 'Calle 44 #20-103');

INSERT INTO laboratorio(RUT, lab_name, lab_address) VALUES('48721', 'Farma Palma', 'Calle 57 #32-28');

INSERT INTO laboratorio(RUT, lab_name, lab_address) VALUES('90076', 'Colvida', 'Carrera 54 #38-74');


INSERT INTO medicamento(medicine_name) VALUES('Choclometanol');

INSERT INTO medicamento(medicine_name) VALUES('Mixamorranilo');

INSERT INTO medicamento(medicine_name) VALUES('Chichanosol');


INSERT INTO stock(medicine_code, RUT, quantity) VALUES('1', '12345', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('2', '12345', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('3', '12345', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('1', '33267', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('2', '33267', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('3', '33267', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('1', '48721', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('2', '48721', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('3', '48721', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('1', '90076', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('2', '90076', '100');

INSERT INTO stock(medicine_code, RUT, quantity) VALUES('3', '90076', '100');