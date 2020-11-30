const { Pool } = require('pg');
const path = require('path');
const { response } = require('express');
const { O_DIRECT } = require('constants');


const pool= new Pool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE, 
    port: process.env.PORT
})

const getRegistry = async(req, res, next)=>{

    const response = await pool.query(`SELECT pt.name1 as patient_name1, pt.name2 as patient_name2, pt.lastname1 as patient_lastname1, pt.lastname2 as patient_lastname2,
                                       reg.patient_document, dt.name1 as doctor_name1, dt.name2 as doctor_name2, dt.lastname1 as doctor_lastname1, dt.lastname2 as doctor_lastname2,
                                       reg.doctor_document, reg.register_day, reg.register_month, reg.register_year, reg.register_hour, ep.patient_weight, ep.patient_temperature, ep.blood_pressure, ep.observations, rm.medicine_name, rd.dose
                                       FROM paciente pt, registro reg, doctor dt, estado_paciente ep, registro_medicamento rm, registro_dosis_medicamento rd
                                       WHERE pt.patient_document = reg.patient_document
                                       AND dt.doctor_document = reg.doctor_document
                                       AND ep.register_number = reg.register_number
                                       AND rm.register_number = reg.register_number
                                       AND rd.dose_id = rm.dose_id`);
    res.json(response.rows);
}

const getRegistryByID = async(req, res, next)=>{

    const patient_document = req.params.document;

    const response = await pool.query(`SELECT pt.name1 as patient_name1, pt.name2 as patient_name2, pt.lastname1 as patient_lastname1, pt.lastname2 as patient_lastname2,
                                        reg.patient_document, dt.name1 as doctor_name1, dt.name2 as doctor_name2, dt.lastname1 as doctor_lastname1, dt.lastname2 as doctor_lastname2,
                                        reg.doctor_document, reg.register_day, reg.register_month, reg.register_year, reg.register_hour, ep.patient_weight, ep.patient_temperature, ep.blood_pressure, ep.observations, rm.medicine_name, rd.dose
                                        FROM paciente pt, registro reg, doctor dt, estado_paciente ep, registro_medicamento rm, registro_dosis_medicamento rd
                                        WHERE pt.patient_document = '${patient_document}'
                                        AND reg.patient_document = '${patient_document}'
                                        AND dt.doctor_document IN(SELECT doctor_document FROM registro
                                                                WHERE patient_document = '${patient_document}')
                                        AND ep.register_number = reg.register_number
                                        AND rm.register_number = reg.register_number
                                        AND rd.dose_id = rm.dose_id`);

    res.json(response.rows);
}

const createRegistry = async(req, res, next)=>{

    const { patient_document, doctor_document, patient_weight, patient_temperature, blood_pressure, observations, medicine_name, dose } = req.body;

    const doctorExist = await pool.query(`SELECT * FROM doctor WHERE doctor_document='${String(doctor_document)}'`);
    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);
    var date = new Date();
    if(doctorExist.rowCount==0){
        res.send('No se puede hacer un registro sin un doctor valido');
    }else{
        if(patientExist.rowCount==0){
            res.send('No se puede hacer un registro a un paciente no existente');
        }else{
            
            var register_hour = (date.getHours()+7) + ':' + date.getMinutes() + ':' + date.getSeconds();
            await pool.query(`INSERT INTO registro (patient_document, doctor_document, register_day, register_month, register_year, register_hour) VALUES ($1, $2, $3, $4, $5, $6)`, [patient_document, doctor_document, (date.getDate()-1), (date.getMonth()+1), date.getFullYear(), register_hour]);
            await pool.query(`INSERT INTO estado_paciente (patient_weight, patient_temperature, blood_pressure, observations) VALUES ($1, $2, $3, $4)`, [patient_weight, patient_temperature, blood_pressure, observations]);
            
            const doseExist = await pool.query(`SELECT * FROM registro_dosis_medicamento WHERE dose='${dose}'`);

            if(doseExist.rowCount==0){
                await pool.query('INSERT INTO registro_dosis_medicamento (dose) VALUES ($1)',[dose]);
                await pool.query(`INSERT INTO registro_medicamento (medicine_name) VALUES ($1)`,[medicine_name]);
                res.send('Registro creado');
            }else{
                const di=doseExist.rows[0].dose_id;
                await pool.query(`INSERT INTO registro_medicamento (medicine_name, dose_id) VALUES ($1, $2)`,[medicine_name, di]);
                res.send('Registro creado');
            }
        }
    }
}

const getPatient = async(req, res, next)=>{

    const response = await pool.query (`SELECT DISTINCT pt.name1 AS patient_name1, pt.name2 as patient_name2, pt.lastname1 as patient_lastname1, pt.lastname2 as patient_lastname2, pt.patient_document, pt.type_of_document, pt.people_in_the_house as patient_roommates, pt.age as patient_age,
                                        rp.register_date, rp.register_hour, sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname, sp.lastname2 as public_worker_lastname2,
                                        up.patient_address, up.neighborhood, geo.coordinates, ct.possible_infection_city,
                                        dt.name1 as doctor_name1, dt.name2 as doctor_name2, dt.lastname1 as doctor_lastname1, dt.lastname2 as doctor_lastname2 
                                        FROM paciente pt, registro_paciente rp, servidor_publico sp, ubicacion_paciente up, geolocalizacion geo, ciudad ct, doctor dt, doctor_asignado da
                                        WHERE rp.patient_document = pt.patient_document
                                        AND up.patient_document = pt.patient_document 
                                        AND geo.location_id = up.location_id
                                        AND ct.city_id = up.city_id
                                        AND dt.doctor_document = da.doctor_document 
                                        AND da.patient_document = pt.patient_document
                                        AND sp.public_worker_ID = rp.public_worker_ID`);
    res.json(response.rows);
}

const getPatientByID = async(req, res, next)=>{

    const patient_document = req.params.document;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);

    if(patientExist.rowCount==0){
        //res.send('El paciente no existe');

        res.status(404).json('El paciente no existe');
    }else{
        const response = await pool.query (`SELECT DISTINCT pt.name1 AS patient_name1, pt.name2 as patient_name2, pt.lastname1 as patient_lastname1, pt.lastname2 as patient_lastname2, pt.patient_document, pt.type_of_document, pt.people_in_the_house as patient_roommates, pt.age as patient_age,
        rp.register_date, rp.register_hour, sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname, sp.lastname2 as public_worker_lastname2,
        up.patient_address, up.neighborhood, geo.coordinates, ct.possible_infection_city,
        dt.name1 as doctor_name1, dt.name2 as doctor_name2, dt.lastname1 as doctor_lastname1, dt.lastname2 as doctor_lastname2 
        FROM paciente pt, registro_paciente rp, servidor_publico sp, ubicacion_paciente up, geolocalizacion geo, ciudad ct, doctor dt
        WHERE pt.patient_document = '${patient_document}' 
        AND rp.patient_document = '${patient_document}' 
        AND up.patient_document = '${patient_document}' 
        AND sp.public_worker_ID IN(SELECT public_worker_ID FROM registro_paciente
                                  WHERE patient_document = '${patient_document}')
        AND geo.location_ID IN(SELECT location_ID FROM ubicacion_paciente
                              WHERE patient_document = '${patient_document}')
        AND ct.city_ID IN(SELECT city_ID FROM ubicacion_paciente
                      WHERE patient_document = '${patient_document}')
        AND dt.doctor_document IN(SELECT doctor_document FROM doctor_asignado
                                  WHERE patient_document = '${patient_document}')`);

        res.json(response.rows);
    }
}

const createPatient = async(req, res, next)=>{

    const { type_of_document, patient_document, name1, name2, lastname1, lastname2, age, people_in_the_house, public_worker_ID, patient_address, coordinates, possible_infection_city, doctor_document, neighborhood } = req.body;

    const doctorExist = await pool.query(`SELECT * FROM doctor WHERE doctor_document='${String(doctor_document)}'`);

    const publicServerExist = await pool.query(`SELECT * FROM servidor_publico WHERE public_worker_ID='${public_worker_ID}'`);

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);

    var date = new Date();

    if(publicServerExist.rowCount==0){
        res.send('El servidor publico no existe, no puedes crear un paciente');
    }else{        
        if(patientExist.rowCount==0){
            if(doctorExist.rowCount==0){
                res.send('No existe el doctor asignado, paciente no creado');
            }else{
                var register_date = (date.getUTCDate()-1) + '-' + (date.getUTCMonth()) + '-' + date.getUTCFullYear();
                var register_hour = (date.getUTCHours()+7) + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds();
                await pool.query('INSERT INTO paciente(type_of_document, patient_document, name1, name2, lastname1, lastname2, age, people_in_the_house) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [type_of_document, patient_document, name1, name2, lastname1, lastname2, age, people_in_the_house]);
                await pool.query('INSERT INTO registro_paciente(patient_document, register_date, register_hour, public_worker_ID) VALUES ($1, $2, $3, $4)', [patient_document, register_date, register_hour, public_worker_ID]);
                
                var location_id;
                var city_id;

                const coordinatesExist= await pool.query(`SELECT * FROM geolocalizacion WHERE coordinates='${coordinates}'`);

                if(coordinatesExist.rowCount==0){
                    await pool.query('INSERT INTO geolocalizacion(coordinates) VALUES ($1)', [coordinates]);
                    location_id = (await pool.query(`SELECT location_id FROM geolocalizacion WHERE coordinates='${coordinates}'`)).rows[0].location_id;
                }else{
                    location_id = (await pool.query(`SELECT location_id FROM geolocalizacion WHERE coordinates='${coordinates}'`)).rows[0].location_id;
                    //await pool.query('INSERT INTO ubicacion_paciente(location_ID) VALUES ($1)', [String(location_id)]);
                }
                
                const cityExist= await pool.query(`SELECT * FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`);

                if(cityExist.rowCount ==0){
                    await pool.query('INSERT INTO ciudad(possible_infection_city) VALUES ($1)', [possible_infection_city]);
                    city_id = (await pool.query(`SELECT city_id FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`)).rows[0].city_id;
                }else{
                    city_id = (await pool.query(`SELECT city_id FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`)).rows[0].city_id;
                   // await pool.query('INSERT INTO ubicacion_paciente(city_id) VALUES ($1)', [String(city_id)]);
                }

                await pool.query('INSERT INTO ubicacion_paciente(patient_document, patient_address, location_id, city_id, neighborhood) VALUES ($1, $2, $3, $4, $5)', [patient_document, patient_address, location_id, city_id, neighborhood]);

                await pool.query('INSERT INTO doctor_asignado(doctor_document, patient_document) VALUES ($1, $2)', [doctor_document, patient_document]);

                res.send('Paciente creado');
            }
        }else{
            res.send('El paciente ya existe');
        }
    }
}

const editPatient = async(req,res,next)=>{

    const { patient_document, name1, name2, lastname1, lastname2, age, people_in_the_house, patient_address, coordinates, possible_infection_city, doctor_document, neighborhood } = req.body;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);

    if(patientExist.rowCount==0){
        res.send('El paciente que intentas editar no existe');
    }else{
        const searchDoctor = await pool.query(`SELECT * FROM doctor_asignado WHERE doctor_document='${doctor_document}'`);

        if(searchDoctor.rowCount==0){
            res.send('No existe el doctor que quieres asignarle a este paciente');
        }else{
            await pool.query(`UPDATE doctor_asignado SET doctor_document='${doctor_document}' WHERE patient_document='${patient_document}'`);

            var location_id;
            var city_id;
    
            const coordinatesExist= await pool.query(`SELECT * FROM geolocalizacion WHERE coordinates='${coordinates}'`);
    
                if(coordinatesExist.rowCount==0){
                    await pool.query('INSERT INTO geolocalizacion(coordinates) VALUES ($1)', [coordinates]);
                    location_id = (await pool.query(`SELECT location_id FROM geolocalizacion WHERE coordinates='${coordinates}'`)).rows[0].location_id;
                }else{
                    location_id = (await pool.query(`SELECT location_id FROM geolocalizacion WHERE coordinates='${coordinates}'`)).rows[0].location_id;
                    //await pool.query('INSERT INTO ubicacion_paciente(location_ID) VALUES ($1)', [String(location_id)]);
                }
                    
                const cityExist= await pool.query(`SELECT * FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`);
    
                if(cityExist.rowCount ==0){
                    await pool.query('INSERT INTO ciudad(possible_infection_city) VALUES ($1)', [possible_infection_city]);
                    city_id = (await pool.query(`SELECT city_id FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`)).rows[0].city_id;
                }else{
                     city_id = (await pool.query(`SELECT city_id FROM ciudad WHERE possible_infection_city='${possible_infection_city}'`)).rows[0].city_id;
                    // await pool.query('INSERT INTO ubicacion_paciente(city_id) VALUES ($1)', [String(city_id)]);
                }
    
            await pool.query(`UPDATE paciente SET name1='${String(name1)}',name2='${String(name2)}',lastname1='${String(lastname1)}',lastname2='${String(lastname2)}',age='${String(age)}',people_in_the_house='${String(people_in_the_house)}' WHERE patient_document='${String(patient_document)}'`);
            
            await pool.query(`UPDATE ubicacion_paciente SET patient_address='${patient_address}', location_id='${location_id}', city_id='${city_id}', neighborhood='${neighborhood}' WHERE patient_document='${patient_document}'`);
            
            res.send('Usuario editado');
        }
    }
}

const deletePatient = async(req, res, next)=>{

    const patient_document = req.body.patient_document;
    
    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);

    if(patientExist.rowCount==0){
        res.send('El paciente que intentas borrar no existe');
    }else{
        //BORRADO DE HIJOS
        await pool.query(`DELETE FROM doctor_asignado WHERE patient_document='${patient_document}'`);
        await pool.query(`DELETE FROM ubicacion_paciente WHERE patient_document='${patient_document}'`);
        await pool.query(`DELETE FROM registro_paciente WHERE patient_document='${patient_document}'`);
        await pool.query(`DELETE FROM personas_con_las_que_vive WHERE patient_document='${patient_document}'`);

        //BORRADO DE PADRE
        await pool.query(`DELETE FROM paciente WHERE patient_document='${String(patient_document)}'`);

        res.send('USUARIO BORRADO');
    }
}

const getRoommates = async(req, res, next)=>{

    const patient_document = req.body.patient_document;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);

    if(patientExist.rowCount==0){
        res.send('El paciente referido no existe');
    }else{

        const response = await pool.query(`SELECT * FROM personas_con_las_que_vive
                                        WHERE patient_document='${patient_document}'`);
        res.json(response.rows);
    }
}

const createRoommates = async(req, res, next)=>{

    const {contact_document, name1, name2, lastname1, lastname2, relationship, patient_document} = req.body;

    if((await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`)).rowCount == 0){
        res.send('El paciente referido no existe');
    }else{
        await pool.query('INSERT INTO personas_con_las_que_vive(patient_document, contact_document, name1, name2, lastname1, lastname2, relationship) VALUES ($1, $2, $3, $4, $5, $6, $7)', [patient_document, contact_document, name1, name2, lastname1, lastname2, relationship]);
        res.send('Compañero de vivienda, creado');
    }
}

const getDoctor = async(req, res, next)=>{

    const response = await pool.query(`SELECT dc.type_of_document, dc.doctor_document, dc.name1 as doctor_name1, dc.name2 as doctor_name2, dc.lastname1 as doctor_lastname1, dc.lastname2 as doctor_lastname2,
                                        ud.university_name, ep.entity_name, vd.doctor_address, vd.neighborhood, rd.register_date, rd.register_hour,
                                        sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname1, sp.lastname2 as public_worker_lastname2
                                        FROM doctor dc, universidad_doctor ud, vivienda_doctor vd, entidad_promotora_de_salud ep, registro_doctor rd, servidor_publico sp
                                        WHERE vd.doctor_document = dc.doctor_document
                                        AND rd.doctor_document = dc.doctor_document
                                        AND sp.public_worker_ID = rd.public_worker_ID
                                        AND ep.entity_ID = dc.entity_ID
                                        AND ud.university_ID = dc.university_ID`)
    res.json(response.rows);
}

const getDoctorByID = async(req, res, next)=>{

    const doctor_document = req.params.document;

    const response = await pool.query(`SELECT dc.type_of_document, dc.doctor_document, dc.name1 as doctor_name1, dc.name2 as doctor_name2, dc.lastname1 as doctor_lastname1, dc.lastname2 as doctor_lastname2,
                                         ud.university_name, ep.entity_name, vd.doctor_address, vd.neighborhood, rd.register_date, rd.register_hour,
                                         sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname1, sp.lastname2 as public_worker_lastname2
                                         FROM doctor dc, universidad_doctor ud, vivienda_doctor vd, entidad_promotora_de_salud ep, registro_doctor rd, servidor_publico sp
                                         WHERE dc.doctor_document='${doctor_document}'
                                         AND vd.doctor_document='${doctor_document}'
                                         AND rd.doctor_document='${doctor_document}'
                                         AND ud.university_id IN(SELECT university_id FROM doctor WHERE doctor_document='${doctor_document}')
                                         AND ep.entity_id IN(SELECT entity_id FROM doctor WHERE doctor_document='${doctor_document}')
                                         AND sp.public_worker_ID IN(SELECT public_worker_ID FROM registro_doctor
                                         WHERE doctor_document ='${doctor_document}')`);

    res.json(response.rows);
}

const createDoctor = async(req, res, next)=>{

    const { doctor_document, type_of_document, name1, name2, lastname1, lastname2, university_name, entity_name, doctor_address, neighborhood, public_worker_ID, login_password} = req.body;

    const actualRowsU = (await pool.query('SELECT university_name FROM universidad_doctor')).rows;
    const actualRowsE = (await pool.query('SELECT entity_name FROM entidad_promotora_de_salud')).rows;
    var date= new Date();


    var encontradoU= new Boolean(false);
    var encontradoE= new Boolean(false);

    for(var i=0; i<(await pool.query('SELECT * FROM universidad_doctor')).rowCount; i++){
        if(actualRowsU[i].university_name == university_name){
            encontradoU = true;
        }
    }
    if(encontradoU==true){
        
    }else{
        await pool.query('INSERT INTO universidad_doctor(university_name) VALUES ($1)', [university_name]);
    }

    for(var i=0; i<(await pool.query('SELECT * FROM entidad_promotora_de_salud')).rowCount; i++){
        if(actualRowsE[i].entity_name == entity_name){
            encontradoE=true;
        }
    }
    if(encontradoE==true){
        
    }else{
        await pool.query('INSERT INTO entidad_promotora_de_salud(entity_name) VALUES ($1)', [entity_name]);
    }

    const univ = (await pool.query(`SELECT university_id FROM universidad_doctor WHERE university_name='${String(university_name)}'`)).rows[0].university_id;

    const enti = (await pool.query(`SELECT entity_id FROM entidad_promotora_de_salud WHERE entity_name='${String(entity_name)}'`)).rows[0].entity_id;

    const alreadyDoctor = await pool.query(`SELECT * FROM doctor WHERE doctor_document='${String(doctor_document)}'`);

    const worker = await pool.query(`SELECT * FROM servidor_publico WHERE public_worker_ID='${String(public_worker_ID)}'`);

    if(worker.rowCount==0){
        res.send('Servidor público no encontrado');
    }else{
        if(alreadyDoctor.rowCount==0){
            var register_date = (date.getUTCDate()-1) + '-' + date.getUTCMonth()+1 + '-' + date.getUTCFullYear();
            var register_hour = (date.getUTCHours()+7) + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds();
            await pool.query('INSERT INTO doctor(doctor_document, type_of_document, name1, name2, lastname1, lastname2, university_id, entity_id, login_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [doctor_document, type_of_document, name1, name2, lastname1, lastname2, univ, enti, login_password]);
            await pool.query('INSERT INTO vivienda_doctor(doctor_document, doctor_address, neighborhood) VALUES ($1, $2, $3)', [doctor_document, doctor_address, neighborhood]);
            await pool.query('INSERT INTO registro_doctor(doctor_document, public_worker_ID, register_date, register_hour) VALUES ($1, $2, $3, $4)', [doctor_document, public_worker_ID, register_date, register_hour]);
            res.send('Doctor creado');
            
        }else{
            res.send('Este doctor ya existe');
        }
    }
}

const createPublicServer = async(req, res, next)=>{

    const { public_worker_document, name1, name2, lastname1, lastname2, position, login_password } = req.body;

    const serverPublicExist = await pool.query(`SELECT * FROM servidor_publico WHERE public_worker_document='${public_worker_document}'`);

    if(serverPublicExist.rowCount==0){

        const positionServerPublicExist = await pool.query(`SELECT * FROM cargo_servidor_publico WHERE position='${String(position)}'`);

        if(positionServerPublicExist.rowCount==0){
            await pool.query('INSERT INTO cargo_servidor_publico(position) VALUES ($1)',[position]);
            const posAux = (await pool.query(`SELECT position_ID FROM cargo_servidor_publico WHERE position='${String(position)}'`)).rows[0].position_id;
            await pool.query('INSERT INTO servidor_publico(public_worker_document, name1, name2, lastname1, lastname2, position_id, login_password) VALUES ($1, $2, $3, $4, $5, $6, $7)', [public_worker_document, name1, name2, lastname1, lastname2, posAux, login_password]);
            res.send('Servidor publico creado');
        }else{
            const posAux = (await pool.query(`SELECT position_ID FROM cargo_servidor_publico WHERE position='${String(position)}'`)).rows[0].position_id;
            await pool.query('INSERT INTO servidor_publico(public_worker_document, name1, name2, lastname1, lastname2, position_id, login_password) VALUES ($1, $2, $3, $4, $5, $6, $7)', [public_worker_document, name1, name2, lastname1, lastname2, posAux, login_password]);
            res.send('Servidor publico creado');
        }
    }else{
        res.send('El servidor publico ya existe');
    }
}

const getEmergencyContactByID = async(req, res, next)=>{

    const patient_document = req.params.document;

    const response= await pool.query(`SELECT DISTINCT cde.patient_document AS patient_referred, cde.contact_document, cde.name1, cde.name2, cde.lastname1, cde.lastname2, cde.relationship, tc.phone, ec.email
                                        FROM contacto_de_emergencia cde, telefono_contacto tc, email_contacto ec
                                        WHERE cde.patient_document='123'
                                        AND cde.contact_id = tc.contact_id
                                        AND cde.contact_id = ec.contact_id`);
    res.json(response.rows);

}

const createEmergencyContact = async(req, res, next)=>{

    const { patient_document, contact_document, name1, name2, lastname1, lastname2, relationship, phone, email } = req.body;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);
    const contactExist= await pool.query(`SELECT * FROM contacto_de_emergencia WHERE patient_document='${patient_document}' AND contact_document='${contact_document}'`);

    if(patientExist.rowCount==0){
        res.send('No existe el paciente referido');
    }else{
        if(contactExist.rowCount==0){
            await pool.query('INSERT INTO contacto_de_emergencia(patient_document, contact_document, name1, name2, lastname1, lastname2, relationship) VALUES ($1, $2, $3, $4, $5, $6, $7)', [patient_document, contact_document, name1, name2, lastname1, lastname2, relationship]);
            await pool.query('INSERT INTO telefono_contacto(phone) VALUES ($1)', [phone]);
            await pool.query('INSERT INTO email_contacto(email) VALUES ($1)', [email]);
            res.send('Contacto de emergencia creado');
        }else{
            res.send('El contacto de emergencia ya existe')
        }
    }
}

const deleteEmergencyContact = async(req, res, next)=>{

    const { patient_document, contact_document } = req.body;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);
    const contactExist= await pool.query(`SELECT * FROM contacto_de_emergencia WHERE contact_document='${contact_document}'`);

    if(patientExist.rowCount==0){
        res.send('El paciente referido no existe');
    }else{
        if(contactExist.rowCount==0){
            res.send('El contacto de emergencia no existe');
        }else{
            var pd= await pool.query(`SELECT contact_id from contacto_de_emergencia WHERE patient_document='${patient_document}' AND contact_document='${contact_document}'`);

            if(pd.rowCount==0){
                res.send('El contacto de emergencia no corresponde a este paciente');
            }else{
                await pool.query(`DELETE FROM email_contacto WHERE contact_id='${pd.rows[0].contact_id}'`);
                await pool.query(`DELETE FROM telefono_contacto WHERE contact_id='${pd.rows[0].contact_id}'`);
                await pool.query(`DELETE FROM contacto_de_emergencia WHERE patient_document='${patient_document}' AND contact_document='${contact_document}'`);
                res.send('Contacto borrado');
            }
        }
    }
}

const editEmergencyContact = async(req, res, next)=>{

    const { patient_document, contact_document, name1, name2, lastname1, lastname2, relationship, phone, email } = req.body;

    const patientExist = await pool.query(`SELECT * FROM paciente WHERE patient_document='${patient_document}'`);
    const contactExist= await pool.query(`SELECT * FROM contacto_de_emergencia WHERE patient_document='${patient_document}' AND contact_document='${contact_document}'`);

    if(patientExist.rowCount==0){
        res.send('El paciente no existe');
    }else{
        if(contactExist.rowCount==0){
            res.send('El contacto que intentas editar no existe');
        }else{

            var pd= await pool.query(`SELECT contact_id FROM contacto_de_emergencia WHERE patient_document='${patient_document}' AND contact_document='${contact_document}'`);
            await pool.query(`UPDATE contacto_de_emergencia SET name1='${name1}', name2='${name2}', lastname1='${lastname1}', lastname2='${lastname2}', relationship='${relationship}'`);
            await pool.query(`UPDATE telefono_contacto SET phone='${phone}' WHERE contact_id='${pd.rows[0].contact_id}'`);
            await pool.query(`UPDATE email_contacto SET email='${email}' WHERE contact_id='${pd.rows[0].contact_id}'`);
            res.send('Contacto de emergencia editado');
        }
    }

}

const getReport = async(req, res, next)=>{

    const response = await pool.query('SELECT * FROM informe');

    res.json(response.rows);

}

const getReportByID = async(req, res, next)=>{

    const id = req.params.id;

    const response = await pool.query(`SELECT * FROM informe WHERE report_number='${id}`);

    res.json(response.rows);
}

const createReport = async(req, res, next)=>{

    var date= new Date();
    var report_date = (date.getDate()-1) + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
    var report_hour = (date.getHours()+7) + ':' + date.getMinutes() + ':' + date.getSeconds();

    await pool.query(`INSERT INTO informe (report_date, report_hour) VALUES ($1, $2)`,[report_date, report_hour]);

    const auxN = await pool.query(`SELECT DISTINCT neighborhood FROM ubicacion_paciente`);

    var cantidad=0;

    for(var i=0;i<auxN.rowCount;i++){

       const actualNeighborhood = auxN.rows[i].neighborhood;
       
       cantidad = cantidad + parseInt((await pool.query(`SELECT COUNT(neighborhood) FROM ubicacion_paciente WHERE neighborhood='${actualNeighborhood}'`)).rows[0].count);
    }

    const promedioBarrio = Math.round(cantidad/auxN.rowCount);

    await pool.query(`INSERT INTO estadisticas_barrio (neighborhood_average) VALUES ($1)`,[promedioBarrio]);

    const auxE = await pool.query(`SELECT * FROM paciente`);

    var cantidad2=0;
    
    for(var j=0;j<auxE.rowCount;j++){

        const actualAge = auxE.rows[j].age;

        cantidad2 = cantidad2 + parseInt(actualAge);
    }

    const promedioEdad = Math.round(cantidad2/auxE.rowCount);

    await pool.query(`INSERT INTO estadisticas_edad (age_average) VALUES ($1)`,[promedioEdad]);

    res.send('Informe creado');
}

const getStock = async(req, res, next)=>{

    const lab_name = req.params.lab_name;

    const response = await pool.query(`SELECT DISTINCT lb.lab_name, st.quantity, md.medicine_name FROM laboratorio lb, stock st, medicamento md
                                        WHERE lb.lab_name = '${lab_name}' 
                                        AND st.quantity IN(SELECT quantity FROM stock
                                                        WHERE RUT IN (SELECT RUT FROM laboratorio
                                                                    WHERE lab_name = '${String(lab_name)}'))
                                        AND md.medicine_code = st.medicine_code`);

    res.json(response.rows);
}

const doOrder = async(req, res, next)=>{
    const { medicine_name, lab_name, doctor_document, quantity } = req.body;

    const response = await pool.query(`INSERT INTO pedido(medicine_code, RUT, doctor_document, quantity) VALUES((SELECT medicine_code FROM medicamento
                                                                                                    WHERE medicine_name = '${medicine_name}'),
                                                                                                    (SELECT RUT FROM laboratorio
                                                                                                    WHERE lab_name = '${lab_name}'),
                                                                                                    '${String(doctor_document)}', '${quantity}');`); 

    const actualquantity = await pool.query(`SELECT quantity FROM stock WHERE medicine_code
                                            IN (SELECT medicine_code FROM medicamento
                                                WHERE medicine_name = '${medicine_name}')
                                            AND RUT IN (SELECT RUT FROM laboratorio
                                                        WHERE lab_name = '${lab_name}')`);

    const operation = actualquantity.rows[0].quantity - quantity;

    const response2 = await pool.query(`UPDATE stock SET quantity = '${operation}'
                                        WHERE medicine_code
                                        IN (SELECT medicine_code FROM medicamento
                                            WHERE medicine_name = '${medicine_name}')
                                        AND RUT IN (SELECT RUT FROM laboratorio
                                                    WHERE lab_name = '${lab_name}')  `);
    

    res.send('Pedido realizado');
}

const getOrder = async(req, res, next)=>{

    const response = await pool.query('SELECT * FROM pedido');

    res.json(response.rows);
}

const login = async(req, res, next)=>{ 
    const { document, password } = req.body;

    const doctorSize = await pool.query(`SELECT * FROM doctor`);
    const serverPublicSize = await pool.query(`SELECT * FROM servidor_publico`);

    var isDoctor = new Boolean(false);
    var isServerPublic = new Boolean(false);

    for(var i=0;i<serverPublicSize.rowCount;i++){
        if((await pool.query(`SELECT * FROM servidor_publico WHERE public_worker_document='${document}'`)).rowCount == 0){
            isServerPublic=false;
        }else{
            if(((await pool.query(`SELECT login_password FROM servidor_publico WHERE public_worker_document='${document}'`)).rows[0].login_password) == password){
                isServerPublic=true;
                break;
            }else{
                res.send('Contraseña incorrecta');
                return;
            }
        }
    }

    if(isServerPublic==false){
        for(var i=0;i<doctorSize.rowCount;i++){
            if((await pool.query(`SELECT * FROM doctor WHERE doctor_document='${document}'`)).rowCount == 0){
                isDoctor=false;
            }else{
                if(((await pool.query(`SELECT login_password FROM doctor WHERE doctor_document='${document}'`)).rows[0].login_password) == password){
                    isDoctor=true;
                    break;
                }else{
                    res.send('Contraseña incorrecta');
                    return;
                }
            }
        }
    }



    if(isServerPublic){

        const response = await pool.query(`SELECT sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname1,
                                            sp.lastname2 as public_worker_lastname2, sp.public_worker_document, cs.position
                                            FROM servidor_publico sp, cargo_servidor_publico cs
                                            WHERE sp.public_worker_document ='${document}'
                                            AND sp.position_id = cs.position_id`);
        res.json(response.rows);

    }else if(isDoctor){

        const response = await pool.query(`SELECT dc.type_of_document, dc.doctor_document, dc.name1 as doctor_name1, dc.name2 as doctor_name2, dc.lastname1 as doctor_lastname1, dc.lastname2 as doctor_lastname2,
                                            ud.university_name, ep.entity_name, vd.doctor_address, vd.neighborhood, rd.register_date, rd.register_hour,
                                            sp.name1 as public_worker_name1, sp.name2 as public_worker_name2, sp.lastname1 as public_worker_lastname1, sp.lastname2 as public_worker_lastname2
                                            FROM doctor dc, universidad_doctor ud, vivienda_doctor vd, entidad_promotora_de_salud ep, registro_doctor rd, servidor_publico sp
                                            WHERE dc.doctor_document='${document}'
                                            AND vd.doctor_document='${document}'
                                            AND rd.doctor_document='${document}'
                                            AND ud.university_id IN(SELECT university_id FROM doctor WHERE doctor_document='${document}')
                                            AND ep.entity_id IN(SELECT entity_id FROM doctor WHERE doctor_document='${document}')
                                            AND sp.public_worker_ID IN(SELECT public_worker_ID FROM registro_doctor
                                            WHERE doctor_document ='${document}')`);
        res.json(response.rows);
    }else{
        res.send('Este usuario no está registrado');
    }
}



module.exports= {login, getRegistry, getRegistryByID, createRegistry, getPatient, getPatientByID, createPatient, editPatient, deletePatient, getRoommates, createRoommates, getDoctor, getDoctorByID, createDoctor, createPublicServer, getEmergencyContactByID, createEmergencyContact, deleteEmergencyContact, editEmergencyContact, getReport, getReportByID, createReport, getStock, doOrder, getOrder};
