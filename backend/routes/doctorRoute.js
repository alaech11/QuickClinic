import express from 'express'
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile } from '../controllers/doctorControler.js'
import authDoctor from '../middlewares/authDoctor.js'
import { 
    getDoctorQuestions, 
    answerQuestion,
    getQuestionThread 
} from '../controllers/questionController.js'

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


export default doctorRouter