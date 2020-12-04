const { Router } = require('express');
const passport = require('passport');
const router = Router();
const {login, getRegistry, getRegistryByID, createRegistry, getPatient, getPatientByDoctor, getPatientByID, createPatient, editPatient, deletePatient, getEmergencyContactByID, createEmergencyContact, deleteEmergencyContact, createPublicServer, createRoommates, getDoctorByID, createDoctor, getRoommates, getReport, createReport, getStock, getStockByLab, getStockByName, doOrder, getOrder, editEmergencyContact, getReportByID, getDoctor, deleteRommates} = require('../controllers/index.controller');

router.post('/login', login)

router.get('/getRegistry', getRegistry)

router.get('/getRegistry/:document', getRegistryByID)

router.post('/createRegistry', createRegistry)

router.get('/getPatient', getPatient)

router.get('/getPatientByDoctor/:doctor', getPatientByDoctor)

router.get('/getPatient/:document', getPatientByID)

router.post('/createPatient', createPatient)

router.put('/editPatient', editPatient)

router.delete('/deletePatient', deletePatient)

router.get('/getEmergencyContact/:document', getEmergencyContactByID)

router.post('/createEmergencyContact', createEmergencyContact)

router.delete('/deleteEmergencyContact', deleteEmergencyContact)

router.put('/editEmergencyContact', editEmergencyContact)

router.post('/createPublicServer', createPublicServer)

router.get('/getRoommates/:document', getRoommates)

router.post('/createRoommates', createRoommates)

router.delete('/deleteRommates', deleteRommates)

router.get('/getReport', getReport)

router.get('/getReport/:id', getReportByID)

router.post('/createReport', createReport)

router.get('/getStock', getStock)

router.get('/getStock/:lab', getStockByLab)

router.get('getStockByName', getStockByName)

router.post('/doOrder', doOrder)

router.get('/getOrder', getOrder)

router.post('/createDoctor', createDoctor)

router.get('/getDoctor',getDoctor)

router.get('/getDoctor/:document', getDoctorByID)

//router.delete('/deletePublicServer', deletePublicServer)

module.exports = router;