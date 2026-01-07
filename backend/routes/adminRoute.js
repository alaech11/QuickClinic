import express from 'express'
import { addDoctor,allDoctors,appointmentsAdmin,loginAdmin, appointmentCancel, adminDashboard,addPatient,allPatients,deletePatient, deleteDoctor } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailablity } from '../controllers/doctorControler.js'

const adminRouter = express.Router()

adminRouter.post('/add-doctor',authAdmin,upload.single('image'),addDoctor)
adminRouter.post('/login',loginAdmin)
adminRouter.post('/all-doctors',authAdmin,allDoctors)
adminRouter.post('/change-availablity',authAdmin,changeAvailablity)
adminRouter.get('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
adminRouter.post('/add-patient', authAdmin, upload.single('image'), addPatient)
adminRouter.post('/all-patients', authAdmin, allPatients)
adminRouter.post('/delete-patient', authAdmin, deletePatient) 
adminRouter.post('/delete-doctor', authAdmin, deleteDoctor) 

export default adminRouter