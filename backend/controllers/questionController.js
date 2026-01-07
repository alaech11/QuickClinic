import questionModel from "../models/questionModel.js";
import appointmentModel from "../models/appointmentModel.js";

// User asks a question
export const askQuestion = async (req, res) => {
    try {
        const { userId } = req.body;
        const { appointmentId, question, parentQuestionId } = req.body;

        // Check if appointment exists and is completed
        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (!appointment.isCompleted) {
            return res.json({ success: false, message: "You can only ask questions for completed appointments" });
        }

        if (appointment.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // If this is a follow-up question, check if parent exists
        let threadId = null;
        if (parentQuestionId) {
            const parentQuestion = await questionModel.findById(parentQuestionId);
            if (!parentQuestion) {
                return res.json({ success: false, message: "Original question not found" });
            }
            // Use the parent's threadId if it exists, otherwise use parent's _id
            threadId = parentQuestion.threadId || parentQuestion._id;
        }

        // Create new question
        const newQuestion = new questionModel({
            appointmentId,
            userId,
            doctorId: appointment.docId,
            question,
            isFollowUp: !!parentQuestionId,
            parentQuestionId: parentQuestionId || null,
            threadId
        });

        await newQuestion.save();

        res.json({ 
            success: true, 
            message: "Question submitted successfully",
            question: newQuestion 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all questions for a specific appointment
export const getAppointmentQuestions = async (req, res) => {
    try {
        const { userId } = req.body;
        const { appointmentId } = req.params;

        const appointment = await appointmentModel.findById(appointmentId);
        
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (appointment.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // Get all questions for this appointment, sorted by date (oldest first for conversation flow)
        const questions = await questionModel.find({ appointmentId })
            .populate('doctorId', 'name speciality image')
            .sort({ askedAt: 1 });

        // Organize questions by thread for conversation view
        const organizedQuestions = organizeQuestionsByThread(questions);

        res.json({ success: true, questions: organizedQuestions });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Helper function to organize questions by conversation thread
const organizeQuestionsByThread = (questions) => {
    const threads = [];
    const questionMap = new Map();
    
    // First pass: organize by threadId
    questions.forEach(question => {
        const threadId = question.threadId || question._id;
        
        if (!questionMap.has(threadId.toString())) {
            questionMap.set(threadId.toString(), {
                threadId: threadId,
                questions: [],
                isAnswered: false,
                lastActivity: question.askedAt
            });
        }
        
        const thread = questionMap.get(threadId.toString());
        thread.questions.push(question);
        
        // Update thread status
        if (question.isAnswered) {
            thread.isAnswered = true;
        }
        
        if (question.askedAt > thread.lastActivity) {
            thread.lastActivity = question.askedAt;
        }
        
        // If there's an answer, update last activity with answer time
        if (question.answeredAt && question.answeredAt > thread.lastActivity) {
            thread.lastActivity = question.answeredAt;
        }
    });
    
    // Convert map to array and sort by last activity (newest first)
    threads.push(...questionMap.values());
    threads.sort((a, b) => b.lastActivity - a.lastActivity);
    
    // Sort questions within each thread by askedAt (oldest first)
    threads.forEach(thread => {
        thread.questions.sort((a, b) => a.askedAt - b.askedAt);
    });
    
    return threads;
};

// Get all questions for a user (across all appointments)
export const getUserQuestions = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Get all appointments for the user
        const appointments = await appointmentModel.find({ userId, isCompleted: true });
        const appointmentIds = appointments.map(app => app._id);
        
        // Get all questions for these appointments
        const questions = await questionModel.find({ appointmentId: { $in: appointmentIds } })
            .populate('doctorId', 'name speciality image')
            .populate('appointmentId', 'slotDate slotTime')
            .sort({ askedAt: -1 });

        res.json({ success: true, questions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get single question by ID
export const getQuestionById = async (req, res) => {
    try {
        const { userId } = req.body;
        const { questionId } = req.params;

        const question = await questionModel.findById(questionId)
            .populate('doctorId', 'name speciality image');

        if (!question) {
            return res.json({ success: false, message: "Question not found" });
        }

        if (question.userId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // If this question is part of a thread, get all questions in the thread
        let threadQuestions = [];
        if (question.threadId) {
            threadQuestions = await questionModel.find({
                $or: [
                    { _id: question.threadId },
                    { threadId: question.threadId }
                ]
            }).sort({ askedAt: 1 });
        } else {
            threadQuestions = await questionModel.find({
                $or: [
                    { _id: question._id },
                    { threadId: question._id }
                ]
            }).sort({ askedAt: 1 });
        }

        res.json({ success: true, question, threadQuestions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor gets all questions (across all appointments)
export const getDoctorQuestions = async (req, res) => {
    try {
        const { docId } = req.body;
        
        // Get appointments for this doctor
        const appointments = await appointmentModel.find({ docId, isCompleted: true });
        const appointmentIds = appointments.map(app => app._id);
        
        // Get all questions for these appointments
        const questions = await questionModel.find({ appointmentId: { $in: appointmentIds } })
            .populate('userId', 'name image')
            .populate('appointmentId', 'slotDate slotTime')
            .sort({ isAnswered: 1, askedAt: -1 });

        // Organize by appointment for better UI
        const questionsByAppointment = {};
        
        questions.forEach(question => {
            const appointmentId = question.appointmentId._id.toString();
            if (!questionsByAppointment[appointmentId]) {
                questionsByAppointment[appointmentId] = {
                    appointment: question.appointmentId,
                    patient: question.userId,
                    questions: [],
                    hasUnanswered: false
                };
            }
            
            questionsByAppointment[appointmentId].questions.push(question);
            if (!question.isAnswered) {
                questionsByAppointment[appointmentId].hasUnanswered = true;
            }
        });

        res.json({ 
            success: true, 
            questions,
            questionsByAppointment: Object.values(questionsByAppointment) 
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor answers a question
export const answerQuestion = async (req, res) => {
    try {
        const { docId } = req.body;
        const { questionId, answer } = req.body;

        const question = await questionModel.findById(questionId);

        if (!question) {
            return res.json({ success: false, message: "Question not found" });
        }

        if (question.doctorId.toString() !== docId.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        question.answer = answer;
        question.isAnswered = true;
        question.answeredAt = Date.now();
        
        await question.save();

        res.json({ 
            success: true, 
            message: "Answer submitted successfully",
            question 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get conversation thread for a specific question
export const getQuestionThread = async (req, res) => {
    try {
        const { questionId } = req.params;

        const mainQuestion = await questionModel.findById(questionId);
        
        if (!mainQuestion) {
            return res.json({ success: false, message: "Question not found" });
        }

        // Get the thread ID
        const threadId = mainQuestion.threadId || mainQuestion._id;

        // Get all questions in this thread
        const threadQuestions = await questionModel.find({
            $or: [
                { _id: threadId },
                { threadId: threadId }
            ]
        })
        .populate('userId', 'name image')
        .populate('doctorId', 'name image')
        .sort({ askedAt: 1 });

        res.json({ 
            success: true, 
            threadQuestions,
            appointmentId: mainQuestion.appointmentId 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};