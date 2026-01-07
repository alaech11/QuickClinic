import { createContext } from "react";

export const AppContext = createContext()

const AppContextprovider = (props) => {

    const currency = '$'

    const calculateAge = (dob) =>{
        const today = new Date()
        const britDate = new Date(dob)

        let age = today.getFullYear()- britDate.getFullYear()
        return age
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