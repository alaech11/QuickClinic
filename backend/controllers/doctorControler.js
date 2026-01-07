import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken' 
import appointmentModel from "../models/appointmentModel.js"

const changeAvailablity = async (req,res) => {
    try {
        const {docId} = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available})
        res.json({success:true, message: 'Availablity Changed'})
    } catch (error) {
         console.log(error)
        res.json({success:false,message:error.message})
    }

}
const doctorList = async (req,res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password','-email'])
        res.json({success:true,doctors})
    } catch (error) {
         console.log(error)
        res.json({success:false,message:error.message})
    }
}
//api for doctor login
const loginDoctor = async (req,res) => {
    try {
        const {email, password} = req.body
        const doctor = await doctorModel.findOne({email})

        if (!doctor) {
            return res.json({success:false,message:'Invalid credentials'})
        }

        const isMatch = await bcrypt.compare(password,doctor.password)

        if (isMatch) {
            const token = jwt.sign({id:doctor._id},process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
             return res.jason({success:false,message:'Invalid credentials'})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api to get doctor appointment 
const appointmentsDoctor = async (req,res) => {
    try {
        const {docId} = req.body
        const appointments = await appointmentModel.find({docId})

        res.json({success:true,appointments})
    } catch (error) {
         console.log(error)
        res.json({success:false,message:error.message})
    }
}

//api to marke appointment complete 

const appointmentComplete = async (req,res) => {
    try {
        const {docId, appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {isCompleted: true})

            return res.json({success:true,message:"Appointment Completed"})
        }else{
             return res.json({success:false,message:"Mark Failed"})
        }
    } catch (error) {
        console.log("Error in appointmentCancel:", error);
        res.json({success:false, message: error.message || "Internal server error"});
    }

}

const appointmentCancel = async (req,res) => {
    try {
        const {docId, appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})


            // Remove the slot from doctor's slots_booked
            const doctor = await doctorModel.findById(docId)
            
            if (doctor && doctor.slots_booked) {
                // Extract slotDate and slotTime from appointment
                const slotDate = appointmentData.slotDate // Format: "day_month_year"
                const slotTime = appointmentData.slotTime // Format: "10:00 AM"
                
                // Remove this time slot from the doctor's booked slots
                if (doctor.slots_booked[slotDate]) {
                    doctor.slots_booked[slotDate] = doctor.slots_booked[slotDate].filter(
                        time => time !== slotTime
                    )
                }
                  await doctor.save()
            }


            return res.json({success:true,message:"Appointment Cancelled"})
        }else{
             return res.json({success:false,message:"Cancellation Failed"})
        }
    } catch (error) {
        console.log("Error in appointmentCancel:", error);
        res.json({success:false, message: error.message || "Internal server error"});
    }

}

//api to doxtor dashboard
const doctorDashboard = async (req,res) =>{
    try {
        const {docId} = req.body
        const appointments = await appointmentModel.find({docId})
        
        // Count completed appointments instead of calculating earnings
        let completedAppointments = 0
        appointments.forEach((item)=>{
            if (item.isCompleted) {
                completedAppointments += 1
            }
        })

        let patients = []

        appointments.forEach((item)=>{
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            completedAppointments: completedAppointments, // Changed from earnings to completedAppointments
            appointments: appointments.length,
            patients: patients.length,
            latestAppointment: appointments.reverse().slice(0,5)
        }
        res.json({success:true,dashData})
    } catch (error) { 
        console.log(error);
        res.json({success:false, message: error.message || "Internal server error"});
    }
}

//api to get doctor profile 
const doctorProfile = async (req,res) =>{
    try {
        const {docId} = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({success:true,profileData})
    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message || "Internal server error"});
    }
}

//api to udate doctor pofile 
const updateDoctorProfile = async (req,res) =>{
    try {
        const {docId, fees, address, available} = req.body

        await doctorModel.findByIdAndUpdate(docId, {fees, address, available})

        res.json({success:true,message:'Profile updated'})
    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message || "Internal server error"});
    }
}

export {changeAvailablity,doctorList, loginDoctor, appointmentsDoctor,appointmentComplete, appointmentCancel, doctorDashboard, 
    doctorProfile, updateDoctorProfile,
}