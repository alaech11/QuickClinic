import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        default: ''
    },
    askedAt: {
        type: Date,
        default: Date.now
    },
    answeredAt: {
        type: Date
    },
    isAnswered: {
        type: Boolean,
        default: false
    },
    // New field to track if this is a follow-up question
    isFollowUp: {
        type: Boolean,
        default: false
    },
    // Reference to parent question if it's a follow-up
    parentQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'question',
        default: null
    },
    // Track conversation thread
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'question',
        default: null
    }
});

// Index for faster queries
questionSchema.index({ appointmentId: 1, askedAt: -1 });
questionSchema.index({ doctorId: 1, isAnswered: 1 });

export default mongoose.model('question', questionSchema);