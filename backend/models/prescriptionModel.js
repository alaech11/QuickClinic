import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'appointment', 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    fileName: { 
        type: String, 
        required: true 
    },
    fileUrl: { 
        type: String, 
        required: true 
    },
    downloadUrl: { 
        type: String ,
        required: true 
    },

    fileSize: { 
        type: Number 
    },
    uploadedAt: { 
        type: Date, 
        default: Date.now 
    },
    notes: { 
        type: String, 
        default: '' 
    }
}, {
    timestamps: true
});

// Indexes for faster queries
prescriptionSchema.index({ userId: 1, uploadedAt: -1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ appointmentId: 1 });

const prescriptionModel = mongoose.models.prescription || mongoose.model('prescription', prescriptionSchema);

export default prescriptionModel;