import axios from "axios";
import { useState } from "react";
import { createContext } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext()

const AdminContextprovider = (props) => {

    const [aToken,setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') :'')
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors,setDoctors] = useState([])
    const [appointments,setAppointments] = useState([])
    const [patients, setPatients] = useState([]) 
    const [dashData,setDashData] = useState(false)


    const getAllDoctors = async () => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/all-doctors', {}, {headers:{aToken}})
            if (data.success) {
                setDoctors(data.doctors)
                console.log(data.doctors)
                
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    const changeAvailablity = async (docId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/change-availablity', {docId}, {headers:{aToken}})
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllAppointments = async () =>{
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/appointments',{headers:{aToken}})
            if (data.success) {
                setAppointments(data.appointments)
                console.log(data.appointments);
                
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) =>{
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/cancel-appointment', {appointmentId},{headers:{aToken}})
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getDashData = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/admin/dashboard', {headers:{aToken}})
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData);
                
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    

    // get all patients
    const getAllPatients = async () => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/all-patients', {}, {headers:{aToken}})
            if (data.success) {
                setPatients(data.patients)
                console.log("Patients loaded:", data.patients)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //add a patient
    const addPatient = async (formData) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/add-patient', formData, {headers:{aToken}})
            if (data.success) {
                toast.success(data.message)
                return {success: true}
            } else {
                toast.error(data.message)
                return {success: false, message: data.message}
            }
        } catch (error) {
            toast.error(error.message)
            return {success: false, message: error.message}
        }
    }

    const deletePatient = async (patientId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/delete-patient', 
                {patientId}, 
                {headers:{aToken}}
            )
            if (data.success) {
                toast.success(data.message)
                // Remove the deleted patient from the local state
                setPatients(prev => prev.filter(patient => patient._id !== patientId))
                return {success: true}
            } else {
                toast.error(data.message)
                return {success: false, message: data.message}
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete patient")
            return {success: false, message: error.message}
        }
    }

    // delete patient
    const confirmDeletePatient = async (patientId, patientName) => {
        if (window.confirm(`Are you sure you want to delete patient "${patientName}"? This action cannot be undone.`)) {
            const result = await deletePatient(patientId)
            return result
        }
        return {success: false, message: "Deletion cancelled"}
    }

    const deleteDoctor = async (docId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/admin/delete-doctor', 
                {docId}, 
                {headers:{aToken}}
            )
            if (data.success) {
                toast.success(data.message)
                // Remove the deleted doctor from the local state
                setDoctors(prev => prev.filter(doctor => doctor._id !== docId))
                return {success: true}
            } else {
                toast.error(data.message)
                return {success: false, message: data.message}
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete doctor")
            return {success: false, message: error.message}
        }
    }

    // confirm and delete doctor
    const confirmDeleteDoctor = async (docId, doctorName) => {
        if (window.confirm(`Are you sure you want to delete Dr. "${doctorName}"? This will also delete all their appointments and cannot be undone.`)) {
            const result = await deleteDoctor(docId)
            return result
        }
        return {success: false, message: "Deletion cancelled"}
    }

    const value = {
        aToken, setAToken,
        backendUrl, doctors,
        getAllDoctors, changeAvailablity,
        deleteDoctor, confirmDeleteDoctor, 
        appointments, setAppointments,
        getAllAppointments, cancelAppointment,
        getDashData, dashData,
        patients, setPatients,
        getAllPatients, addPatient,
        deletePatient, confirmDeletePatient
    }

    return(
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextprovider