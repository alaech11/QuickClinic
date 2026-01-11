import { createContext } from "react";

export const AppContext = createContext()

const AppContextprovider = (props) => {

    const currency = '$'

    const calculateAge = (dob) => {
    if (!dob || dob === "Not Selected") return "N/A";
    
    try {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    } catch (error) {
        console.error("Error calculating age:", error);
        return "N/A";
    }
}

    const months = ['','Jan', 'Feb', 'Mar', 'Apr', 'May', 'June','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const slotDtaeFormat = (slotDate) =>{
const dateArray = slotDate.split('_')
return dateArray[0]+" "+ months[Number(dateArray[1])] + " " + dateArray[2]
}

    const value = {
calculateAge,slotDtaeFormat,currency,
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextprovider