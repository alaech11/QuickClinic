import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'
import { 
    getDoctorQuestions, 
    answerQuestion,
    getQuestionThread 
} from '../controllers/questionController.js'
import { 
    uploadPrescription, 
    getPatientPrescriptions,
    deletePrescription ,
    viewPrescription 
} from '../controllers/prescriptionController.js';

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});





const doctorRouter = express.Router()

doctorRouter.get('/list',doctorList)
doctorRouter.post('/login',loginDoctor)
doctorRouter.get('/appointments',authDoctor,appointmentsDoctor)
doctorRouter.post('/complete-appointment',authDoctor,appointmentComplete)
doctorRouter.post('/cancel-appointment',authDoctor,appointmentCancel)
doctorRouter.get('/dashboard',authDoctor,doctorDashboard)
doctorRouter.get('/profile',authDoctor,doctorProfile)
doctorRouter.post('/update-profile',authDoctor,updateDoctorProfile)
doctorRouter.get('/questions', authDoctor, getDoctorQuestions)
doctorRouter.post('/answer-question', authDoctor, answerQuestion)
doctorRouter.get('/question-thread/:questionId', authDoctor, getQuestionThread)
doctorRouter.post('/upload-prescription', 
    authDoctor, 
    upload.single('prescriptionFile'), 
    uploadPrescription
);

doctorRouter.get('/patient-prescriptions/:patientId', 
    authDoctor, 
    getPatientPrescriptions
);
doctorRouter.post('/delete-prescription', 
    authDoctor, 
    deletePrescription
);

doctorRouter.get(
  '/prescription/view/:prescriptionId',
  viewPrescription
);


export default doctorRouter