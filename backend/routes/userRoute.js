import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { 
    askQuestion, 
    getUserQuestions, 
    getAppointmentQuestions,
    getQuestionById,
    getQuestionThread 
} from '../controllers/questionController.js'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)

userRouter.post('/ask-question', authUser, askQuestion)
userRouter.get('/questions', authUser, getUserQuestions)
userRouter.get('/appointment-questions/:appointmentId', authUser, getAppointmentQuestions)
userRouter.get('/question/:questionId', authUser, getQuestionById)
userRouter.get('/question-thread/:questionId', authUser, getQuestionThread)

export default userRouter