import { useState, useEffect, useRef } from "react";
import { createContext } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [dToken, setDToken] = useState(localStorage.getItem('dToken') || '');
    const [doctorId, setDoctorId] = useState(null);
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dashData, setDashData] = useState(false);
    const [profileData, setProfileData] = useState(false);
    const [patientPrescriptions, setPatientPrescriptions] = useState({});

    const isFetching = useRef(false);

    const getAppointments = async () => {
        if (isFetching.current) return;
        
        if (!dToken) {
            console.log("No token available");
            return;
        }
        
        isFetching.current = true;
        setLoading(true);
        
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, { 
                headers: { dtoken: dToken } 
            });
            
            if (data.success) {
                setAppointments(data.appointments);
                console.log("Appointments set:", data.appointments);
            } else {
                toast.error(data.message || "Failed to fetch appointments");
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast.error(error.response?.data?.message || error.message || "An error occurred");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    const completeAppointment = async (appointmentId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/doctor/complete-appointment', 
                {appointmentId}, 
                {headers:{dtoken: dToken}}
            )
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/doctor/cancel-appointment',
                {appointmentId}, 
                {headers:{dtoken: dToken}}
            )
             
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log("Error cancelling appointment:", error);
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const getDashData= async ()=>{
        try {
            const {data} = await axios.get(backendUrl +'/api/doctor/dashboard', 
                {headers:{dtoken: dToken}}
            )
            if (data.success) {
                console.log(data.dashData);
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const getProfileData= async ()=>{
        try {
            const {data} = await axios.get(backendUrl +'/api/doctor/profile', 
                {headers:{dtoken: dToken}}
            )
            if (data.success) {
                console.log("Profile data:", data.profileData);
                setProfileData(data.profileData)
                setDoctorId(data.profileData._id)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    // Upload prescription with proper error handling
    const uploadPrescription = async (appointmentId, file, notes = '') => {
        try {
            const formData = new FormData();
            formData.append('appointmentId', appointmentId);
            formData.append('prescriptionFile', file);
            formData.append('notes', notes);

            console.log('Uploading prescription for appointment:', appointmentId);
            console.log('File size:', file.size, 'File type:', file.type);

            const { data } = await axios.post(
  `${backendUrl}/api/doctor/upload-prescription`,
  formData,
  { headers: { dtoken: dToken } } // let axios/browser set Content-Type with boundary
);


            if (data.success) {
                toast.success('Prescription uploaded successfully');
                // Refresh prescriptions for this patient
                const appointment = appointments.find(a => a._id === appointmentId);
                if (appointment) {
                    await getPatientPrescriptions(appointment.userId);
                }
                return data.prescription;
            } else {
                toast.error(data.message || 'Upload failed');
                return null;
            }
        } catch (error) {
            console.error("Upload prescription error:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
            toast.error(errorMsg);
            return null;
        }
    };

    // Get ALL prescriptions for a patient
    const getPatientPrescriptions = async (patientId) => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/doctor/patient-prescriptions/${patientId}`,
                { headers: { dtoken: dToken } }
            );

            if (data.success) {
                setPatientPrescriptions(prev => ({
                    ...prev,
                    [patientId]: data.prescriptions
                }));
                return data.prescriptions;
            }
            return [];
        } catch (error) {
            console.error("Get patient prescriptions error:", error);
            return [];
        }
    };

    // Delete prescription
    const deletePrescription = async (prescriptionId, patientId) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/delete-prescription`,
                { prescriptionId },
                { headers: { dtoken: dToken } }
            );

            if (data.success) {
                toast.success('Prescription deleted');
                // Update local state
                setPatientPrescriptions(prev => {
                    const updated = { ...prev };
                    if (updated[patientId]) {
                        updated[patientId] = updated[patientId].filter(p => p._id !== prescriptionId);
                    }
                    return updated;
                });
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Delete prescription error:", error);
            toast.error(error.message);
            return false;
        }
    };

    const value = {
        dToken,
        setDToken,
        backendUrl,
        getAppointments,
        appointments,
        setAppointments,
        loading,
        completeAppointment,
        cancelAppointment,
        dashData, setDashData, getDashData,
        profileData, setProfileData, getProfileData,
        uploadPrescription,
        getPatientPrescriptions,
        patientPrescriptions,
        deletePrescription,
        doctorId
    };

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;