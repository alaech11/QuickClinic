import { useState, useEffect, useRef } from "react";
import { createContext } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppContext } from "./AppContext";
import { useContext } from "react";

export const DoctorContext = createContext();

const DoctorContextprovider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [dToken, setDToken] = useState(localStorage.getItem('dToken') || '');
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)

     /*const [doctors,setDoctors] = useState([])*/
    
    // Use useRef to track if we're already fetching
    const isFetching = useRef(false);


  /*  const getDoctorsData = async () =>{
            try {
                const {data} = await axios.get(backendUrl + '/api/doctor/list')
                if (data.success) {
                    setDoctors(data.doctors)
                } else{
                    toast.error(data.message)
                }
            } catch (error) {
                console.log(error);
                toast.error(error.message)
                
            }
        }*/


    const getAppointments = async () => {
        // Prevent multiple simultaneous calls
        if (isFetching.current) return;
        
        // Check if token exists
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
            
            if (data.success) { // Fixed: 'success' not 'sucess'
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
            const {data} = await axios.post(backendUrl + '/api/doctor/complete-appointment',{appointmentId}, {headers:{dToken}})
            if (data.success) {
                toast.success(data.message)
                getAppointments()
                
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
            
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const {data} = await axios.post(backendUrl + '/api/doctor/cancel-appointment',{appointmentId}, {headers:{dToken}})
             
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log("Error cancelling appointment:", error);
        console.log("Error response:", error.response);
        toast.error(error.response?.data?.message || error.message)
            
        }
    }

const getDashData= async ()=>{
    try {
        const {data} = await axios.get(backendUrl +'/api/doctor/dashboard', {headers:{dToken}})
        if (data.success) {
            console.log(data.dashData);
            setDashData(data.dashData)
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
}

const getProfileData= async ()=>{
    try {
        const {data} = await axios.get(backendUrl +'/api/doctor/profile', {headers:{dToken}})
        if (data.success) {
            console.log(data.profileData);
            setProfileData(data.profileData)
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
}

    const value = {
        dToken,
        setDToken,
        backendUrl,
        getAppointments,
        appointments,
        setAppointments,
        loading,
        completeAppointment,cancelAppointment,
        dashData,setDashData,getDashData,
        profileData,setProfileData,getProfileData
    };

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextprovider;