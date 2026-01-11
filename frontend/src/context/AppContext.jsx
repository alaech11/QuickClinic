import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from "react-toastify";

export const AppContext = createContext()

const AppContextProvider = (props) =>{

const currencySymbole = '$'
const backendUrl = import.meta.env.VITE_BACKEND_URL
const [doctors,setDoctors] = useState([])

const [userData, setUserData] = useState(null)
const [userPrescriptions, setUserPrescriptions] = useState([]);
const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

const [token,setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)


    const getDoctorsData = async () =>{
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
    }

    const loadUserProfileData = async () =>{
        try {
            const {data} = await axios.get(backendUrl + '/api/user/get-profile', {headers:{token}})
            if (data.success) {
                setUserData(data.userData)
                
            }else{
                toast.error(data,message)
                
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const getUserPrescriptions = async () => {
    if (!token) return;
    
    setLoadingPrescriptions(true);
    try {
        const { data } = await axios.get(backendUrl + '/api/user/prescriptions', {
            headers: { token }
        });
        
        if (data.success) {
            setUserPrescriptions(data.prescriptions);
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        console.error("Get prescriptions error:", error);
        toast.error(error.message);
    } finally {
        setLoadingPrescriptions(false);
    }
};

    const value ={
        doctors,getDoctorsData,
        currencySymbole,
        token,setToken,
        backendUrl,
        userData,setUserData,
        loadUserProfileData,
         getUserPrescriptions,
    userPrescriptions,
    setUserPrescriptions,
    loadingPrescriptions
    }

    useEffect(()=>{
        getDoctorsData()
    },[]) 

    useEffect(()=>{
        if (token) {
            loadUserProfileData()
        } else {
            setUserData(null)
        }
        
    },[token]) 

    

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}


export default AppContextProvider