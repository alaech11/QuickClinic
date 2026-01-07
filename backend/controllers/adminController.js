import validator from "validator"
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"



//api for adding doctor
const addDoctor = async (req,res) => {
    try{

        const {name, email, password, speciality, degree, experience, about, fees, address} = req.body
        const imageFile = req.file

        //checking for all data to add doctor
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({success:false,message:"Missing Details"})
        }

        //validating email format 
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email"})
        }

        //validating strong password
        if(password.legth < 8) {
               return res.json({success:false,message:"Please enter a strong password"})
        }

        //hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword =await bcrypt.hash(password, salt)

        //upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree, 
            experience, 
            about, 
            fees, 
            address:JSON.parse(address),
            date:Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({success:true,message:"Doctor added"})

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api for the admin login 
const loginAdmin = async(req,res) =>{
    try{

        const {email,password} = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password,process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"invalid credentials"})
        }

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


//api to git all doctor list 
const allDoctors = async (req,res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success:true,doctors})
    } catch (error) {
         console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api to get all the appointment list 
const appointmentsAdmin = async (req,res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({success:true,appointments})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api to cancell the appointments fro admin
const appointmentCancel = async (req,res) => {
    try {
        const {appointmentId} = req.body
        
        const appointmentData = await appointmentModel.findById(appointmentId)
        
            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

            //releasing doctor slot
            const {docId, slotDate, slotTime} = appointmentData
            const doctorData = await doctorModel.findById(docId)

            let slots_booked = doctorData.slots_booked
            
            slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime )

            await doctorModel.findByIdAndUpdate(docId, {slots_booked})
            res.json({success:true,message:"appointment cancelled"})
           
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to get doshboard data for admin panel 
const adminDashboard = async (req,res) =>{
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})
        
        // Calculate total revenue from all completed appointments
        let earnings = 0
        appointments.forEach((item) => {
            if (item.isCompleted) {
                earnings += item.amount
            }
        })
        
        // Count completed appointments
        const completedAppointments = appointments.filter(item => item.isCompleted).length

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            completedAppointments: completedAppointments, // Add completed appointments count
            earnings: earnings, // Add total revenue
            patients: users.length,
            latestAppointment: appointments.reverse().slice(0,5)
        }

        res.json({success:true,dashData})
    } catch (error) {
         console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api for adding patient by admin
const addPatient = async (req,res) => {
    try {
        const {name, email, password, phone, address, gender, dob, hasAllergies, allergies} = req.body
        const imageFile = req.file

        // Checking for required data
        if(!name || !email || !password || !phone) {
            return res.json({success:false,message:"Missing required details"})
        }

        // Validating email format
        if(!validator.isEmail(email)) {
            return res.json({success:false,message:"Please enter a valid email"})
        }

        // Validating strong password
        if(password.length < 8) {
            return res.json({success:false,message:"Password must be at least 8 characters long"})
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            return res.json({success:false,message:"Email already registered"})
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Handle image upload or use default
        let imageUrl = userModel.schema.paths.image.defaultValue
        if(imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
            imageUrl = imageUpload.secure_url
        }

        // Parse allergies if they exist
        let parsedAllergies = []
        if (allergies) {
            try {
                parsedAllergies = typeof allergies === 'string' ? JSON.parse(allergies) : allergies
            } catch (error) {
                parsedAllergies = []
            }
        }

        // Create patient data
        const patientData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            phone,
            address: address ? JSON.parse(address) : {line1: '', line2: ''},
            gender: gender || "Not Selected",
            dob: dob || "Not Selected",
            hasAllergies: hasAllergies === 'true' || hasAllergies === true,
            allergies: parsedAllergies
        }

        const newPatient = new userModel(patientData)
        await newPatient.save()
        
        res.json({success:true,message:"Patient added successfully"})

    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api to get all patients list
const allPatients = async (req,res) => {
    try {
        const patients = await userModel.find({}).select('-password')
        res.json({success:true,patients})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const deletePatient = async (req,res) => {
    try {
        const {patientId} = req.body
        
        if(!patientId) {
            return res.json({success:false,message:"Patient ID is required"})
        }

        // Check if patient exists
        const patient = await userModel.findById(patientId)
        if(!patient) {
            return res.json({success:false,message:"Patient not found"})
        }

        // Check if patient has any active appointments
        const activeAppointments = await appointmentModel.find({
            userId: patientId,
            cancelled: false,
            isCompleted: false
        })

        if(activeAppointments.length > 0) {
            return res.json({
                success: false, 
                message: "Cannot delete patient with active appointments. Cancel appointments first."
            })
        }

        // Delete the patient
        await userModel.findByIdAndDelete(patientId)
        
        // Also delete all appointments for this patient (optional - you can keep them if you want)
        await appointmentModel.deleteMany({userId: patientId})
        
        res.json({success:true,message:"Patient deleted successfully"})

    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


const deleteDoctor = async (req,res) => {
    try {
        const {docId} = req.body
        
        if(!docId) {
            return res.json({success:false,message:"Doctor ID is required"})
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(docId)
        if(!doctor) {
            return res.json({success:false,message:"Doctor not found"})
        }

        // Check if doctor has any active appointments
        const activeAppointments = await appointmentModel.find({
            docId: docId,
            cancelled: false,
            isCompleted: false
        })

        if(activeAppointments.length > 0) {
            return res.json({
                success: false, 
                message: "Cannot delete doctor with active appointments. Cancel appointments first."
            })
        }

        // Delete the doctor's image from Cloudinary if it's not the default
        if (doctor.image && !doctor.image.includes('base64')) {
            try {
                // Extract public_id from image URL
                const urlParts = doctor.image.split('/')
                const publicIdWithExtension = urlParts[urlParts.length - 1]
                const publicId = publicIdWithExtension.split('.')[0]
                
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId)
                }
            } catch (cloudinaryError) {
                console.log("Error deleting image from Cloudinary:", cloudinaryError)
                // Continue with deletion even if image deletion fails
            }
        }

        // Delete the doctor
        await doctorModel.findByIdAndDelete(docId)
        
        // Also delete all appointments for this doctor
        await appointmentModel.deleteMany({docId: docId})
        
        res.json({success:true,message:"Doctor deleted successfully"})

    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export {addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, 
        addPatient, allPatients, deletePatient, deleteDoctor}