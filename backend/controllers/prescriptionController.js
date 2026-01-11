import prescriptionModel from '../models/prescriptionModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import axios from 'axios';

// Upload prescription (Doctor only)
const uploadPrescription = async (req, res) => {
    try {
        const { appointmentId, notes } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Basic file validation
        if (!file.mimetype.includes('pdf')) {
            try { fs.unlinkSync(file.path); } catch(e) {}
            return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
        }

        if (file.size > 5 * 1024 * 1024) {
            try { fs.unlinkSync(file.path); } catch(e) {}
            return res.status(400).json({ success: false, message: 'File size too large (max 5MB)' });
        }

        // Get appointment
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            try { fs.unlinkSync(file.path); } catch(e) {}
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Check if appointment is completed
        if (!appointment.isCompleted) {
            try { fs.unlinkSync(file.path); } catch(e) {}
            return res.status(400).json({ 
                success: false, 
                message: 'Appointment must be completed before uploading prescription' 
            });
        }

        // Upload to Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY
        });

         const result = await cloudinary.uploader.upload(file.path, {
  resource_type: 'raw',
  folder: 'prescriptions',
  public_id: `prescription_${Date.now()}_${appointmentId}`,
  type: 'upload'
});


console.log("Cloudinary upload successful:", {
  url: result.secure_url,
  resource_type: result.resource_type,
  format: result.format,
  access_mode: result.access_mode,
  public_id: result.public_id
});

// ✅ THIS is the URL you store and use
const viewUrl = result.secure_url;

const downloadUrl = cloudinary.url(result.public_id, {
  resource_type: 'raw',
  type: 'upload',
  secure: true,
  flags: 'attachment'
});


// Create prescription record
const prescriptionData = {
  appointmentId,
  doctorId: appointment.docId,
  userId: appointment.userId,
  fileName: file.originalname,
  fileUrl: viewUrl,          // 👁 view in browser
  downloadUrl: downloadUrl, 
  fileSize: file.size,
  notes: notes || '',
  uploadedAt: new Date(),
  publicId: result.public_id
};

        const newPrescription = new prescriptionModel(prescriptionData);
        await newPrescription.save();

        // Clean up file
        try { fs.unlinkSync(file.path); } catch(e) {}

        res.json({ 
            success: true, 
            message: 'Prescription uploaded successfully',
            prescription: newPrescription 
        });
    } catch (error) {
        // Clean up file on error
        if (req.file && req.file.path) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to upload prescription'
        });
    }
};

// Get ALL prescriptions for a patient (Doctors can see ALL prescriptions)
const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Get ALL prescriptions for this patient (from ALL doctors)
        const prescriptions = await prescriptionModel.find({ 
            userId: patientId
        })
        .populate('doctorId', 'name speciality image degree')
        .sort({ uploadedAt: -1 }); // Newest first

        // Group by doctor
        const groupedByDoctor = {};
        prescriptions.forEach(prescription => {
            const doctorId = prescription.doctorId._id.toString();
            if (!groupedByDoctor[doctorId]) {
                groupedByDoctor[doctorId] = {
                    doctor: prescription.doctorId,
                    prescriptions: []
                };
            }
            groupedByDoctor[doctorId].prescriptions.push(prescription);
        });

        // Convert to array and sort by latest prescription date
        const sortedDoctors = Object.values(groupedByDoctor).sort((a, b) => {
            const latestA = a.prescriptions[0]?.uploadedAt || 0;
            const latestB = b.prescriptions[0]?.uploadedAt || 0;
            return new Date(latestB) - new Date(latestA);
        });

        res.json({ 
            success: true, 
            prescriptions: sortedDoctors 
        });
    } catch (error) {
        console.error("Get patient prescriptions error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions for logged-in patient
const getUserPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Get all prescriptions for user with doctor info
        const prescriptions = await prescriptionModel.find({ userId })
            .populate('doctorId', 'name speciality image degree')
            .sort({ uploadedAt: -1 });

        // Group by doctor
        const groupedByDoctor = {};
        prescriptions.forEach(prescription => {
            const doctorId = prescription.doctorId._id.toString();
            if (!groupedByDoctor[doctorId]) {
                groupedByDoctor[doctorId] = {
                    doctor: prescription.doctorId,
                    prescriptions: []
                };
            }
            groupedByDoctor[doctorId].prescriptions.push(prescription);
        });

        // Convert to array and sort by latest prescription date
        const sortedDoctors = Object.values(groupedByDoctor).sort((a, b) => {
            const latestA = a.prescriptions[0]?.uploadedAt || 0;
            const latestB = b.prescriptions[0]?.uploadedAt || 0;
            return new Date(latestB) - new Date(latestA);
        });

        res.json({ 
            success: true, 
            prescriptions: sortedDoctors 
        });
    } catch (error) {
        console.error("Get user prescriptions error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Delete prescription (Doctor can only delete their own)
const deletePrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.body;

    const prescription = await prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      return res.json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.doctorId.toString() !== req.doctorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    await cloudinary.uploader.destroy(prescription.publicId);
    await prescriptionModel.findByIdAndDelete(prescriptionId);

    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const viewPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).send('Prescription not found');
    }

    // ✅ Redirect browser to Cloudinary
    return res.redirect(prescription.fileUrl);

  } catch (error) {
    console.error('View prescription error:', error.message);
    res.status(500).send('Unable to open prescription');
  }
};

export { 
    uploadPrescription, 
    getPatientPrescriptions, 
    getUserPrescriptions, 
    deletePrescription,
    viewPrescription 
};